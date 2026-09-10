/**
 * Stacks, queues and monotonic stacks, second wave — the parenthesis-matching
 * and "next greater" questions that dominate Amazon/Google phone screens, plus
 * the queue-simulation rounds Indian service companies favour.
 * Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const randStr = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

/** A uniformly random balanced parentheses string with the given pair count. */
const randBalanced = (rng: Rng, pairs: number) => {
  let out = "";
  let open = 0;
  let left = pairs;
  while (left > 0 || open > 0) {
    if (left > 0 && (open === 0 || rng() < 0.5)) {
      out += "(";
      open++;
      left--;
    } else {
      out += ")";
      open--;
    }
  }
  return out;
};

export const STACKS2_PROBLEMS: CatalogProblem[] = [

  // ── Baseball Game ───────────────────────────────────────────────
  (() => {
    const ref = (operations: string[]) => {
      const stack: number[] = [];
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        if (op === "+") stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
        else if (op === "D") stack.push(2 * stack[stack.length - 1]);
        else if (op === "C") stack.pop();
        else stack.push(parseInt(op, 10));
      }
      let sum = 0;
      for (let i = 0; i < stack.length; i++) sum += stack[i];
      return sum;
    };
    return {
      slug: "baseball-game",
      title: "Baseball Game",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Stack", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "calPoints", params: [{ name: "operations", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are keeping the score for a baseball game with strange rules. You are given a list of strings `operations`, applied in order:\n\n- an integer `x` — record a new score of `x`;\n- `\"+\"` — record a new score that is the sum of the previous two scores;\n- `\"D\"` — record a new score that is double the previous score;\n- `\"C\"` — invalidate the previous score and remove it.\n\nReturn the sum of all the scores on the record after applying every operation.",
        [
          { in: 'operations = ["5","2","C","D","+"]', out: "30", note: "The record ends as 5, 10, 15." },
          { in: 'operations = ["5","-2","4","C","D","9","+","+"]', out: "27" },
          { in: 'operations = ["1"]', out: "1" },
        ],
        ["1 <= operations.length <= 20", "operations[i] is \"C\", \"D\", \"+\", or an integer in [-30000, 30000].", "Every operation is valid when it is applied."]),
      hints: [
        "The record behaves exactly like a stack: `C` pops, everything else pushes.",
        "`+` and `D` read the top of the stack without removing it.",
        "Sum the stack once every operation has been applied.",
      ],
      examples: [
        { input: '["5","2","C","D","+"]', expectedOutput: "30" },
        { input: '["5","-2","4","C","D","9","+","+"]', expectedOutput: "27" },
        { input: '["1"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const ops: string[] = [];
        const stack: number[] = [];
        const n = ri(rng, 1, 20);
        while (ops.length < n) {
          const choices = ["int"];
          if (stack.length >= 1) {
            choices.push("C");
            if (Math.abs(stack[stack.length - 1]) < 2000) choices.push("D");
          }
          if (stack.length >= 2 && Math.abs(stack[stack.length - 1] + stack[stack.length - 2]) < 20000) choices.push("+");
          const c = pick(rng, choices);
          if (c === "int") {
            const v = ri(rng, -20, 20);
            ops.push(String(v));
            stack.push(v);
          } else if (c === "D") {
            ops.push("D");
            stack.push(2 * stack[stack.length - 1]);
          } else if (c === "C") {
            ops.push("C");
            stack.pop();
          } else {
            ops.push("+");
            stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
          }
        }
        return { input: fmtStrArr(ops), expectedOutput: String(ref(ops)) };
      },
      solutions: {
        python: `def calPoints(operations) -> int:\n    stack = []\n    for op in operations:\n        if op == "+":\n            stack.append(stack[-1] + stack[-2])\n        elif op == "D":\n            stack.append(2 * stack[-1])\n        elif op == "C":\n            stack.pop()\n        else:\n            stack.append(int(op))\n    return sum(stack)`,
        javascript: `var calPoints = function(operations) {\n    const stack = [];\n    for (let i = 0; i < operations.length; i++) {\n        const op = operations[i];\n        if (op === "+") stack.push(stack[stack.length - 1] + stack[stack.length - 2]);\n        else if (op === "D") stack.push(2 * stack[stack.length - 1]);\n        else if (op === "C") stack.pop();\n        else stack.push(parseInt(op, 10));\n    }\n    let sum = 0;\n    for (let i = 0; i < stack.length; i++) sum += stack[i];\n    return sum;\n};`,
              typescript: `function calPoints(operations: string[]): number {\n    var stack: number[] = [];\n    for (var i = 0; i < operations.length; i++) {\n        var op = operations[i];\n        if (op === "+") stack.push(stack[stack.length - 1] + stack[stack.length - 2]);\n        else if (op === "D") stack.push(2 * stack[stack.length - 1]);\n        else if (op === "C") stack.pop();\n        else stack.push(parseInt(op, 10));\n    }\n    var sum = 0;\n    for (var j = 0; j < stack.length; j++) sum += stack[j];\n    return sum;\n}`,
              java: `public static int calPoints(String[] operations) {\n    List<Integer> stack = new ArrayList<>();\n    for (String op : operations) {\n        if (op.equals("+")) {\n            stack.add(stack.get(stack.size() - 1) + stack.get(stack.size() - 2));\n        } else if (op.equals("D")) {\n            stack.add(2 * stack.get(stack.size() - 1));\n        } else if (op.equals("C")) {\n            stack.remove(stack.size() - 1);\n        } else {\n            stack.add(Integer.parseInt(op));\n        }\n    }\n    int sum = 0;\n    for (int x : stack) sum += x;\n    return sum;\n}`,
              cpp: `int calPoints(vector<string>& operations) {\n    vector<int> stack;\n    for (const string& op : operations) {\n        if (op == "+") stack.push_back(stack[stack.size() - 1] + stack[stack.size() - 2]);\n        else if (op == "D") stack.push_back(2 * stack.back());\n        else if (op == "C") stack.pop_back();\n        else stack.push_back(stoi(op));\n    }\n    int sum = 0;\n    for (int x : stack) sum += x;\n    return sum;\n}`,
              c: `int calPoints(char** operations, int operationsSize) {\n    int* stack = (int*) malloc((size_t) (operationsSize > 0 ? operationsSize : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < operationsSize; i++) {\n        const char* op = operations[i];\n        if (strcmp(op, "+") == 0) {\n            stack[top] = stack[top - 1] + stack[top - 2];\n            top++;\n        } else if (strcmp(op, "D") == 0) {\n            stack[top] = 2 * stack[top - 1];\n            top++;\n        } else if (strcmp(op, "C") == 0) {\n            top--;\n        } else {\n            stack[top++] = atoi(op);\n        }\n    }\n    int sum = 0;\n    for (int i = 0; i < top; i++) sum += stack[i];\n    free(stack);\n    return sum;\n}`,
              csharp: `public static int CalPoints(string[] operations)\n{\n    var stack = new List<int>();\n    foreach (string op in operations)\n    {\n        if (op == "+") stack.Add(stack[stack.Count - 1] + stack[stack.Count - 2]);\n        else if (op == "D") stack.Add(2 * stack[stack.Count - 1]);\n        else if (op == "C") stack.RemoveAt(stack.Count - 1);\n        else stack.Add(int.Parse(op));\n    }\n    int sum = 0;\n    foreach (int x in stack) sum += x;\n    return sum;\n}`,
              go: `func calPoints(operations []string) int {\n	stack := []int{}\n	for _, op := range operations {\n		if op == "+" {\n			stack = append(stack, stack[len(stack)-1]+stack[len(stack)-2])\n		} else if op == "D" {\n			stack = append(stack, 2*stack[len(stack)-1])\n		} else if op == "C" {\n			stack = stack[:len(stack)-1]\n		} else {\n			v, _ := strconv.Atoi(op)\n			stack = append(stack, v)\n		}\n	}\n	sum := 0\n	for _, x := range stack {\n		sum += x\n	}\n	return sum\n}`,
              kotlin: `fun calPoints(operations: Array<String>): Int {\n    val stack = ArrayList<Int>()\n    for (op in operations) {\n        when (op) {\n            "+" -> stack.add(stack[stack.size - 1] + stack[stack.size - 2])\n            "D" -> stack.add(2 * stack[stack.size - 1])\n            "C" -> stack.removeAt(stack.size - 1)\n            else -> stack.add(op.toInt())\n        }\n    }\n    var sum = 0\n    for (x in stack) sum += x\n    return sum\n}`,
              swift: `func calPoints(_ operations: [String]) -> Int {\n    var stack: [Int] = []\n    for op in operations {\n        if op == "+" {\n            stack.append(stack[stack.count - 1] + stack[stack.count - 2])\n        } else if op == "D" {\n            stack.append(2 * stack[stack.count - 1])\n        } else if op == "C" {\n            stack.removeLast()\n        } else {\n            stack.append(Int(op)!)\n        }\n    }\n    var sum = 0\n    for x in stack { sum += x }\n    return sum\n}`,
              rust: `fn calPoints(operations: Vec<String>) -> i32 {\n    let mut stack: Vec<i32> = Vec::new();\n    for op in operations.iter() {\n        if op == "+" {\n            let n = stack.len();\n            stack.push(stack[n - 1] + stack[n - 2]);\n        } else if op == "D" {\n            let n = stack.len();\n            stack.push(2 * stack[n - 1]);\n        } else if op == "C" {\n            stack.pop();\n        } else {\n            stack.push(op.parse::<i32>().unwrap());\n        }\n    }\n    stack.iter().sum()\n}`,
              php: `function calPoints($operations) {\n    $stack = array();\n    foreach ($operations as $op) {\n        $n = count($stack);\n        if ($op === "+") $stack[] = $stack[$n - 1] + $stack[$n - 2];\n        else if ($op === "D") $stack[] = 2 * $stack[$n - 1];\n        else if ($op === "C") array_pop($stack);\n        else $stack[] = intval($op);\n    }\n    return array_sum($stack);\n}`,
              ruby: `def calPoints(operations)\n  stack = []\n  operations.each do |op|\n    case op\n    when "+" then stack.push(stack[-1] + stack[-2])\n    when "D" then stack.push(2 * stack[-1])\n    when "C" then stack.pop\n    else stack.push(op.to_i)\n    end\n  end\n  stack.sum\nend`,
      },
    };
  })(),

  // ── Make The String Great ───────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const stack: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top !== c && top.toLowerCase() === c.toLowerCase()) {
            stack.pop();
            continue;
          }
        }
        stack.push(c);
      }
      return stack.join("");
    };
    return {
      slug: "make-the-string-great",
      title: "Make The String Great",
      difficulty: "EASY" as const,
      tags: ["String", "Stack", "Amazon", "Adobe"],
      signature: { funcName: "makeGood", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A string is **good** if it contains no two adjacent characters `s[i]` and `s[i+1]` where one is the lowercase and the other the uppercase form of the same letter.\n\nRepeatedly delete such a pair until the string is good, and return the result. The answer is unique regardless of the order of deletions.",
        [
          { in: 's = "leEeetcode"', out: "leetcode", note: 'Deleting "eE" leaves "leetcode".' },
          { in: 's = "abBAcC"', out: "", note: 'Everything cancels out.' },
          { in: 's = "s"', out: "s" },
        ],
        ["1 <= s.length <= 40", "s consists of upper and lowercase English letters."]),
      hints: [
        "Push characters onto a stack one at a time.",
        "Before pushing, check whether the character cancels the current top — same letter, different case.",
        "Cancelling can expose a new pair underneath, which the stack handles automatically.",
      ],
      examples: [
        { input: '"leEeetcode"', expectedOutput: "leetcode" },
        { input: '"abBAcC"', expectedOutput: "" },
        { input: '"s"', expectedOutput: "s" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "aAbBcC" : "aAbBcCdDeEfF";
        const s = randStr(rng, 1, 40, alphabet);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def makeGood(s: str) -> str:\n    stack = []\n    for ch in s:\n        if stack and stack[-1] != ch and stack[-1].lower() == ch.lower():\n            stack.pop()\n        else:\n            stack.append(ch)\n    return "".join(stack)`,
        javascript: `var makeGood = function(s) {\n    const stack = [];\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (stack.length > 0) {\n            const top = stack[stack.length - 1];\n            if (top !== c && top.toLowerCase() === c.toLowerCase()) {\n                stack.pop();\n                continue;\n            }\n        }\n        stack.push(c);\n    }\n    return stack.join("");\n};`,
              typescript: `function makeGood(s: string): string {\n    var stack: string[] = [];\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (stack.length > 0) {\n            var top = stack[stack.length - 1];\n            if (top !== c && top.toLowerCase() === c.toLowerCase()) {\n                stack.pop();\n                continue;\n            }\n        }\n        stack.push(c);\n    }\n    return stack.join("");\n}`,
              java: `public static String makeGood(String s) {\n    StringBuilder stack = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (stack.length() > 0) {\n            char top = stack.charAt(stack.length() - 1);\n            if (top != c && Character.toLowerCase(top) == Character.toLowerCase(c)) {\n                stack.deleteCharAt(stack.length() - 1);\n                continue;\n            }\n        }\n        stack.append(c);\n    }\n    return stack.toString();\n}`,
              cpp: `string makeGood(string s) {\n    string stk;\n    for (char c : s) {\n        if (!stk.empty()) {\n            char top = stk.back();\n            if (top != c && tolower(top) == tolower(c)) {\n                stk.pop_back();\n                continue;\n            }\n        }\n        stk.push_back(c);\n    }\n    return stk;\n}`,
              c: `static char lowerOf(char c) {\n    return (c >= 'A' && c <= 'Z') ? (char) (c + 32) : c;\n}\n\nchar* makeGood(const char* s) {\n    int n = (int) strlen(s);\n    char* stack = (char*) malloc((size_t) n + 2);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (top > 0 && stack[top - 1] != s[i] && lowerOf(stack[top - 1]) == lowerOf(s[i])) {\n            top--;\n            continue;\n        }\n        stack[top++] = s[i];\n    }\n    stack[top] = '\\0';\n    return stack;\n}`,
              csharp: `public static string MakeGood(string s)\n{\n    var stack = new List<char>();\n    foreach (char c in s)\n    {\n        if (stack.Count > 0)\n        {\n            char top = stack[stack.Count - 1];\n            if (top != c && char.ToLowerInvariant(top) == char.ToLowerInvariant(c))\n            {\n                stack.RemoveAt(stack.Count - 1);\n                continue;\n            }\n        }\n        stack.Add(c);\n    }\n    return new string(stack.ToArray());\n}`,
              go: `func makeGood(s string) string {\n	stack := []byte{}\n	lower := func(c byte) byte {\n		if c >= 'A' && c <= 'Z' {\n			return c + 32\n		}\n		return c\n	}\n	for i := 0; i < len(s); i++ {\n		if len(stack) > 0 {\n			top := stack[len(stack)-1]\n			if top != s[i] && lower(top) == lower(s[i]) {\n				stack = stack[:len(stack)-1]\n				continue\n			}\n		}\n		stack = append(stack, s[i])\n	}\n	return string(stack)\n}`,
              kotlin: `fun makeGood(s: String): String {\n    val stack = StringBuilder()\n    for (c in s) {\n        if (stack.isNotEmpty()) {\n            val top = stack[stack.length - 1]\n            if (top != c && top.toLowerCase() == c.toLowerCase()) {\n                stack.deleteCharAt(stack.length - 1)\n                continue\n            }\n        }\n        stack.append(c)\n    }\n    return stack.toString()\n}`,
              swift: `func makeGood(_ s: String) -> String {\n    var stack: [Character] = []\n    for c in s {\n        if let top = stack.last {\n            if top != c && String(top).lowercased() == String(c).lowercased() {\n                stack.removeLast()\n                continue\n            }\n        }\n        stack.append(c)\n    }\n    return String(stack)\n}`,
              rust: `fn makeGood(s: String) -> String {\n    let lower = |c: u8| -> u8 {\n        if c >= b'A' && c <= b'Z' { c + 32 } else { c }\n    };\n    let mut stack: Vec<u8> = Vec::new();\n    for c in s.bytes() {\n        if let Some(&top) = stack.last() {\n            if top != c && lower(top) == lower(c) {\n                stack.pop();\n                continue;\n            }\n        }\n        stack.push(c);\n    }\n    String::from_utf8(stack).unwrap()\n}`,
              php: `function makeGood($s) {\n    $stack = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        if (count($stack) > 0) {\n            $top = $stack[count($stack) - 1];\n            if ($top !== $c && strtolower($top) === strtolower($c)) {\n                array_pop($stack);\n                continue;\n            }\n        }\n        $stack[] = $c;\n    }\n    return implode("", $stack);\n}`,
              ruby: `def makeGood(s)\n  stack = []\n  s.each_char do |c|\n    if !stack.empty? && stack[-1] != c && stack[-1].downcase == c.downcase\n      stack.pop\n    else\n      stack.push(c)\n    end\n  end\n  stack.join\nend`,
      },
    };
  })(),


  // ── Minimum Add to Make Parentheses Valid ───────────────────────
  (() => {
    const ref = (s: string) => {
      let open = 0, needed = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") open++;
        else if (open > 0) open--;
        else needed++;
      }
      return needed + open;
    };
    return {
      slug: "minimum-add-to-make-parentheses-valid",
      title: "Minimum Add to Make Parentheses Valid",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Amazon", "Meta", "Google"],
      signature: { funcName: "minAddToMakeValid", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A parentheses string is valid if every open bracket has a matching close bracket in the right order.\n\nGiven a string `s` of `'('` and `')'`, you may insert a bracket anywhere. Return the minimum number of insertions needed to make `s` valid.",
        [
          { in: 's = "())"', out: "1" },
          { in: 's = "((("', out: "3" },
          { in: 's = "()"', out: "0" },
        ],
        ["1 <= s.length <= 40", "s consists of '(' and ')'."]),
      hints: [
        "Sweep left to right keeping a count of unmatched open brackets.",
        "A `)` with no open bracket waiting can never be matched later, so it needs an insertion right away.",
        "Whatever open brackets remain at the end each need a `)` appended.",
      ],
      examples: [
        { input: '"())"', expectedOutput: "1" },
        { input: '"((("', expectedOutput: "3" },
        { input: '"()"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, "()");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minAddToMakeValid(s: str) -> int:\n    open_count = 0\n    needed = 0\n    for ch in s:\n        if ch == "(":\n            open_count += 1\n        elif open_count > 0:\n            open_count -= 1\n        else:\n            needed += 1\n    return needed + open_count`,
        javascript: `var minAddToMakeValid = function(s) {\n    let open = 0, needed = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") open++;\n        else if (open > 0) open--;\n        else needed++;\n    }\n    return needed + open;\n};`,
              typescript: `function minAddToMakeValid(s: string): number {\n    var open = 0;\n    var needed = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") open++;\n        else if (open > 0) open--;\n        else needed++;\n    }\n    return needed + open;\n}`,
              java: `public static int minAddToMakeValid(String s) {\n    int open = 0, needed = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '(') open++;\n        else if (open > 0) open--;\n        else needed++;\n    }\n    return needed + open;\n}`,
              cpp: `int minAddToMakeValid(string s) {\n    int open = 0, needed = 0;\n    for (char c : s) {\n        if (c == '(') open++;\n        else if (open > 0) open--;\n        else needed++;\n    }\n    return needed + open;\n}`,
              c: `int minAddToMakeValid(const char* s) {\n    int open = 0, needed = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == '(') open++;\n        else if (open > 0) open--;\n        else needed++;\n    }\n    return needed + open;\n}`,
              csharp: `public static int MinAddToMakeValid(string s)\n{\n    int open = 0, needed = 0;\n    foreach (char c in s)\n    {\n        if (c == '(') open++;\n        else if (open > 0) open--;\n        else needed++;\n    }\n    return needed + open;\n}`,
              go: `func minAddToMakeValid(s string) int {\n	open, needed := 0, 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			open++\n		} else if open > 0 {\n			open--\n		} else {\n			needed++\n		}\n	}\n	return needed + open\n}`,
              kotlin: `fun minAddToMakeValid(s: String): Int {\n    var open = 0\n    var needed = 0\n    for (c in s) {\n        if (c == '(') open++\n        else if (open > 0) open--\n        else needed++\n    }\n    return needed + open\n}`,
              swift: `func minAddToMakeValid(_ s: String) -> Int {\n    var open = 0\n    var needed = 0\n    for c in s {\n        if c == "(" { open += 1 }\n        else if open > 0 { open -= 1 }\n        else { needed += 1 }\n    }\n    return needed + open\n}`,
              rust: `fn minAddToMakeValid(s: String) -> i32 {\n    let mut open = 0;\n    let mut needed = 0;\n    for c in s.bytes() {\n        if c == b'(' {\n            open += 1;\n        } else if open > 0 {\n            open -= 1;\n        } else {\n            needed += 1;\n        }\n    }\n    needed + open\n}`,
              php: `function minAddToMakeValid($s) {\n    $open = 0;\n    $needed = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "(") $open++;\n        else if ($open > 0) $open--;\n        else $needed++;\n    }\n    return $needed + $open;\n}`,
              ruby: `def minAddToMakeValid(s)\n  open = 0\n  needed = 0\n  s.each_char do |c|\n    if c == "("\n      open += 1\n    elsif open > 0\n      open -= 1\n    else\n      needed += 1\n    end\n  end\n  needed + open\nend`,
      },
    };
  })(),

  // ── Minimum Remove to Make Valid Parentheses ────────────────────
  (() => {
    const ref = (s: string) => {
      const keep: boolean[] = [];
      for (let i = 0; i < s.length; i++) keep.push(true);
      const openIdx: number[] = [];
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") openIdx.push(i);
        else if (s[i] === ")") {
          if (openIdx.length > 0) openIdx.pop();
          else keep[i] = false;
        }
      }
      for (let i = 0; i < openIdx.length; i++) keep[openIdx[i]] = false;
      let out = "";
      for (let i = 0; i < s.length; i++) {
        if (keep[i]) out += s[i];
      }
      return out;
    };
    return {
      slug: "minimum-remove-to-make-valid-parentheses",
      title: "Minimum Remove to Make Valid Parentheses",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Meta", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "minRemoveToMakeValid", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s` of lowercase letters and parentheses, remove the minimum number of parentheses so that the result is valid.\n\nA string is valid if the brackets match and the letters are left untouched. If several answers have the same minimal length, any of them is accepted; return the one produced by removing **unmatched** brackets and keeping everything else in place.",
        [
          { in: 's = "lee(t(c)o)de)"', out: "lee(t(c)o)de", note: "The last ')' has no partner." },
          { in: 's = "a)b(c)d"', out: "ab(c)d" },
          { in: 's = "))(("', out: "" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters, '(' and ')'."]),
      hints: [
        "Do one pass keeping a stack of the indices of unmatched `(`.",
        "A `)` with an empty stack is unmatched — mark it for deletion immediately.",
        "Whatever indices remain on the stack at the end are unmatched `(` — mark those too, then rebuild the string.",
      ],
      examples: [
        { input: '"lee(t(c)o)de)"', expectedOutput: "lee(t(c)o)de" },
        { input: '"a)b(c)d"', expectedOutput: "ab(c)d" },
        { input: '"))(("', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.5 ? "()ab" : "(())abc");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def minRemoveToMakeValid(s: str) -> str:\n    keep = [True] * len(s)\n    open_idx = []\n    for i, ch in enumerate(s):\n        if ch == "(":\n            open_idx.append(i)\n        elif ch == ")":\n            if open_idx:\n                open_idx.pop()\n            else:\n                keep[i] = False\n    for i in open_idx:\n        keep[i] = False\n    return "".join(ch for ch, k in zip(s, keep) if k)`,
        javascript: `var minRemoveToMakeValid = function(s) {\n    const keep = [];\n    for (let i = 0; i < s.length; i++) keep.push(true);\n    const openIdx = [];\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (c === "(") openIdx.push(i);\n        else if (c === ")") {\n            if (openIdx.length > 0) openIdx.pop();\n            else keep[i] = false;\n        }\n    }\n    for (let i = 0; i < openIdx.length; i++) keep[openIdx[i]] = false;\n    let out = "";\n    for (let i = 0; i < s.length; i++) {\n        if (keep[i]) out += s.charAt(i);\n    }\n    return out;\n};`,
              typescript: `function minRemoveToMakeValid(s: string): string {\n    var keep: boolean[] = [];\n    for (var i = 0; i < s.length; i++) keep.push(true);\n    var openIdx: number[] = [];\n    for (var j = 0; j < s.length; j++) {\n        var c = s.charAt(j);\n        if (c === "(") openIdx.push(j);\n        else if (c === ")") {\n            if (openIdx.length > 0) openIdx.pop();\n            else keep[j] = false;\n        }\n    }\n    for (var k = 0; k < openIdx.length; k++) keep[openIdx[k]] = false;\n    var out = "";\n    for (var m = 0; m < s.length; m++) {\n        if (keep[m]) out += s.charAt(m);\n    }\n    return out;\n}`,
              java: `public static String minRemoveToMakeValid(String s) {\n    boolean[] keep = new boolean[s.length()];\n    Arrays.fill(keep, true);\n    Deque<Integer> openIdx = new ArrayDeque<>();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '(') {\n            openIdx.push(i);\n        } else if (c == ')') {\n            if (!openIdx.isEmpty()) openIdx.pop();\n            else keep[i] = false;\n        }\n    }\n    for (int i : openIdx) keep[i] = false;\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        if (keep[i]) out.append(s.charAt(i));\n    }\n    return out.toString();\n}`,
              cpp: `string minRemoveToMakeValid(string s) {\n    vector<bool> keep(s.size(), true);\n    vector<int> openIdx;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] == '(') openIdx.push_back(i);\n        else if (s[i] == ')') {\n            if (!openIdx.empty()) openIdx.pop_back();\n            else keep[i] = false;\n        }\n    }\n    for (int i : openIdx) keep[i] = false;\n    string out;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (keep[i]) out.push_back(s[i]);\n    }\n    return out;\n}`,
              c: `char* minRemoveToMakeValid(const char* s) {\n    int n = (int) strlen(s);\n    char* keep = (char*) malloc((size_t) n + 1);\n    for (int i = 0; i < n; i++) keep[i] = 1;\n    int* openIdx = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '(') openIdx[top++] = i;\n        else if (s[i] == ')') {\n            if (top > 0) top--;\n            else keep[i] = 0;\n        }\n    }\n    for (int i = 0; i < top; i++) keep[openIdx[i]] = 0;\n    char* out = (char*) malloc((size_t) n + 2);\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        if (keep[i]) out[m++] = s[i];\n    }\n    out[m] = '\\0';\n    free(keep);\n    free(openIdx);\n    return out;\n}`,
              csharp: `public static string MinRemoveToMakeValid(string s)\n{\n    bool[] keep = new bool[s.Length];\n    for (int i = 0; i < s.Length; i++) keep[i] = true;\n    var openIdx = new List<int>();\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == '(') openIdx.Add(i);\n        else if (s[i] == ')')\n        {\n            if (openIdx.Count > 0) openIdx.RemoveAt(openIdx.Count - 1);\n            else keep[i] = false;\n        }\n    }\n    foreach (int i in openIdx) keep[i] = false;\n    var out_ = new List<char>();\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (keep[i]) out_.Add(s[i]);\n    }\n    return new string(out_.ToArray());\n}`,
              go: `func minRemoveToMakeValid(s string) string {\n	keep := make([]bool, len(s))\n	for i := range keep {\n		keep[i] = true\n	}\n	openIdx := []int{}\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			openIdx = append(openIdx, i)\n		} else if s[i] == ')' {\n			if len(openIdx) > 0 {\n				openIdx = openIdx[:len(openIdx)-1]\n			} else {\n				keep[i] = false\n			}\n		}\n	}\n	for _, i := range openIdx {\n		keep[i] = false\n	}\n	out := []byte{}\n	for i := 0; i < len(s); i++ {\n		if keep[i] {\n			out = append(out, s[i])\n		}\n	}\n	return string(out)\n}`,
              kotlin: `fun minRemoveToMakeValid(s: String): String {\n    val keep = BooleanArray(s.length) { true }\n    val openIdx = ArrayList<Int>()\n    for (i in s.indices) {\n        if (s[i] == '(') {\n            openIdx.add(i)\n        } else if (s[i] == ')') {\n            if (openIdx.isNotEmpty()) openIdx.removeAt(openIdx.size - 1)\n            else keep[i] = false\n        }\n    }\n    for (i in openIdx) keep[i] = false\n    val out = StringBuilder()\n    for (i in s.indices) {\n        if (keep[i]) out.append(s[i])\n    }\n    return out.toString()\n}`,
              swift: `func minRemoveToMakeValid(_ s: String) -> String {\n    let chars = Array(s)\n    var keep = [Bool](repeating: true, count: chars.count)\n    var openIdx: [Int] = []\n    for i in 0..<chars.count {\n        if chars[i] == "(" {\n            openIdx.append(i)\n        } else if chars[i] == ")" {\n            if !openIdx.isEmpty { openIdx.removeLast() }\n            else { keep[i] = false }\n        }\n    }\n    for i in openIdx { keep[i] = false }\n    var out = ""\n    for i in 0..<chars.count where keep[i] {\n        out.append(chars[i])\n    }\n    return out\n}`,
              rust: `fn minRemoveToMakeValid(s: String) -> String {\n    let chars: Vec<u8> = s.bytes().collect();\n    let mut keep = vec![true; chars.len()];\n    let mut open_idx: Vec<usize> = Vec::new();\n    for i in 0..chars.len() {\n        if chars[i] == b'(' {\n            open_idx.push(i);\n        } else if chars[i] == b')' {\n            if !open_idx.is_empty() {\n                open_idx.pop();\n            } else {\n                keep[i] = false;\n            }\n        }\n    }\n    for i in open_idx.iter() {\n        keep[*i] = false;\n    }\n    let mut out: Vec<u8> = Vec::new();\n    for i in 0..chars.len() {\n        if keep[i] {\n            out.push(chars[i]);\n        }\n    }\n    String::from_utf8(out).unwrap()\n}`,
              php: `function minRemoveToMakeValid($s) {\n    $n = strlen($s);\n    $keep = array_fill(0, $n, true);\n    $openIdx = array();\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "(") $openIdx[] = $i;\n        else if ($s[$i] === ")") {\n            if (count($openIdx) > 0) array_pop($openIdx);\n            else $keep[$i] = false;\n        }\n    }\n    foreach ($openIdx as $i) $keep[$i] = false;\n    $out = "";\n    for ($i = 0; $i < $n; $i++) {\n        if ($keep[$i]) $out .= $s[$i];\n    }\n    return $out;\n}`,
              ruby: `def minRemoveToMakeValid(s)\n  keep = Array.new(s.length, true)\n  open_idx = []\n  s.each_char.with_index do |c, i|\n    if c == "("\n      open_idx.push(i)\n    elsif c == ")"\n      if open_idx.empty?\n        keep[i] = false\n      else\n        open_idx.pop\n      end\n    end\n  end\n  open_idx.each { |i| keep[i] = false }\n  out = ""\n  s.each_char.with_index { |c, i| out << c if keep[i] }\n  out\nend`,
      },
    };
  })(),

  // ── Score of Parentheses ────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const stack: number[] = [0];
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") stack.push(0);
        else {
          const inner = stack.pop() as number;
          const value = inner === 0 ? 1 : 2 * inner;
          stack[stack.length - 1] += value;
        }
      }
      return stack[0];
    };
    return {
      slug: "score-of-parentheses",
      title: "Score of Parentheses",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Amazon", "Google", "Meta"],
      signature: { funcName: "scoreOfParentheses", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a balanced parentheses string `s`, compute its score under these rules:\n\n- `\"()\"` scores `1`;\n- `AB` scores `A + B`, where `A` and `B` are balanced strings;\n- `(A)` scores `2 * A`.",
        [
          { in: 's = "()"', out: "1" },
          { in: 's = "(())"', out: "2" },
          { in: 's = "()()"', out: "2" },
        ],
        ["2 <= s.length <= 30", "s is a balanced parentheses string.", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Keep a stack of partial scores, one frame per open bracket, plus one frame for the whole string.",
        "On `(`, push a new frame holding 0.",
        "On `)`, pop the frame: a score of 0 means it was a bare `()` worth 1, otherwise it is worth double. Add that into the frame below.",
      ],
      examples: [
        { input: '"()"', expectedOutput: "1" },
        { input: '"(())"', expectedOutput: "2" },
        { input: '"()()"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = randBalanced(rng, ri(rng, 1, 15));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def scoreOfParentheses(s: str) -> int:\n    stack = [0]\n    for ch in s:\n        if ch == "(":\n            stack.append(0)\n        else:\n            inner = stack.pop()\n            stack[-1] += 1 if inner == 0 else 2 * inner\n    return stack[0]`,
        javascript: `var scoreOfParentheses = function(s) {\n    const stack = [0];\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            stack.push(0);\n        } else {\n            const inner = stack.pop();\n            const value = inner === 0 ? 1 : 2 * inner;\n            stack[stack.length - 1] += value;\n        }\n    }\n    return stack[0];\n};`,
              typescript: `function scoreOfParentheses(s: string): number {\n    var stack: number[] = [0];\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            stack.push(0);\n        } else {\n            var inner = stack.pop() as number;\n            var value = inner === 0 ? 1 : 2 * inner;\n            stack[stack.length - 1] += value;\n        }\n    }\n    return stack[0];\n}`,
              java: `public static int scoreOfParentheses(String s) {\n    List<Integer> stack = new ArrayList<>();\n    stack.add(0);\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '(') {\n            stack.add(0);\n        } else {\n            int inner = stack.remove(stack.size() - 1);\n            int value = inner == 0 ? 1 : 2 * inner;\n            stack.set(stack.size() - 1, stack.get(stack.size() - 1) + value);\n        }\n    }\n    return stack.get(0);\n}`,
              cpp: `int scoreOfParentheses(string s) {\n    vector<int> stack;\n    stack.push_back(0);\n    for (char c : s) {\n        if (c == '(') {\n            stack.push_back(0);\n        } else {\n            int inner = stack.back();\n            stack.pop_back();\n            stack.back() += (inner == 0 ? 1 : 2 * inner);\n        }\n    }\n    return stack[0];\n}`,
              c: `int scoreOfParentheses(const char* s) {\n    int n = (int) strlen(s);\n    int* stack = (int*) calloc((size_t) n + 2, sizeof(int));\n    int top = 1;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '(') {\n            stack[top++] = 0;\n        } else {\n            int inner = stack[--top];\n            stack[top - 1] += (inner == 0 ? 1 : 2 * inner);\n        }\n    }\n    int answer = stack[0];\n    free(stack);\n    return answer;\n}`,
              csharp: `public static int ScoreOfParentheses(string s)\n{\n    var stack = new List<int>();\n    stack.Add(0);\n    foreach (char c in s)\n    {\n        if (c == '(')\n        {\n            stack.Add(0);\n        }\n        else\n        {\n            int inner = stack[stack.Count - 1];\n            stack.RemoveAt(stack.Count - 1);\n            stack[stack.Count - 1] += (inner == 0 ? 1 : 2 * inner);\n        }\n    }\n    return stack[0];\n}`,
              go: `func scoreOfParentheses(s string) int {\n	stack := []int{0}\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			stack = append(stack, 0)\n		} else {\n			inner := stack[len(stack)-1]\n			stack = stack[:len(stack)-1]\n			value := 1\n			if inner != 0 {\n				value = 2 * inner\n			}\n			stack[len(stack)-1] += value\n		}\n	}\n	return stack[0]\n}`,
              kotlin: `fun scoreOfParentheses(s: String): Int {\n    val stack = ArrayList<Int>()\n    stack.add(0)\n    for (c in s) {\n        if (c == '(') {\n            stack.add(0)\n        } else {\n            val inner = stack.removeAt(stack.size - 1)\n            val value = if (inner == 0) 1 else 2 * inner\n            stack[stack.size - 1] = stack[stack.size - 1] + value\n        }\n    }\n    return stack[0]\n}`,
              swift: `func scoreOfParentheses(_ s: String) -> Int {\n    var stack: [Int] = [0]\n    for c in s {\n        if c == "(" {\n            stack.append(0)\n        } else {\n            let inner = stack.removeLast()\n            stack[stack.count - 1] += (inner == 0 ? 1 : 2 * inner)\n        }\n    }\n    return stack[0]\n}`,
              rust: `fn scoreOfParentheses(s: String) -> i32 {\n    let mut stack: Vec<i32> = vec![0];\n    for c in s.bytes() {\n        if c == b'(' {\n            stack.push(0);\n        } else {\n            let inner = stack.pop().unwrap();\n            let value = if inner == 0 { 1 } else { 2 * inner };\n            let n = stack.len();\n            stack[n - 1] += value;\n        }\n    }\n    stack[0]\n}`,
              php: `function scoreOfParentheses($s) {\n    $stack = array(0);\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "(") {\n            $stack[] = 0;\n        } else {\n            $inner = array_pop($stack);\n            $value = $inner === 0 ? 1 : 2 * $inner;\n            $stack[count($stack) - 1] += $value;\n        }\n    }\n    return $stack[0];\n}`,
              ruby: `def scoreOfParentheses(s)\n  stack = [0]\n  s.each_char do |c|\n    if c == "("\n      stack.push(0)\n    else\n      inner = stack.pop\n      stack[-1] += (inner == 0 ? 1 : 2 * inner)\n    end\n  end\n  stack[0]\nend`,
      },
    };
  })(),


  // ── Check If Word Is Valid After Substitutions ──────────────────
  (() => {
    const ref = (s: string) => {
      const stack: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "c") {
          if (stack.length < 2) return false;
          const b = stack.pop();
          const a = stack.pop();
          if (a !== "a" || b !== "b") return false;
        } else {
          stack.push(c);
        }
      }
      return stack.length === 0;
    };
    return {
      slug: "check-if-word-is-valid-after-substitutions",
      title: "Check If Word Is Valid After Substitutions",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Amazon", "Google"],
      signature: { funcName: "isValid", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A string is **valid** if it can be built from the empty string by repeatedly inserting `\"abc\"` at any position.\n\nGiven a string `s`, return `true` if it is valid.",
        [
          { in: 's = "aabcbc"', out: "true", note: 'Insert "abc" into "abc" after the first a.' },
          { in: 's = "abcabcababcc"', out: "true" },
          { in: 's = "abccba"', out: "false" },
        ],
        ["1 <= s.length <= 40", "s consists of the letters 'a', 'b' and 'c'."]),
      hints: [
        "Every insertion places `abc` contiguously, so the string always contains an `abc` you can delete.",
        "Push characters on a stack; when you see a `c`, the two items below it must be `a` then `b`.",
        "If that check ever fails, or anything is left on the stack at the end, the string is invalid.",
      ],
      examples: [
        { input: '"aabcbc"', expectedOutput: "true" },
        { input: '"abcabcababcc"', expectedOutput: "true" },
        { input: '"abccba"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        // Half genuine constructions, half random noise, so both verdicts appear.
        let s: string;
        if (rng() < 0.5) {
          s = "";
          const inserts = ri(rng, 1, 13);
          for (let i = 0; i < inserts; i++) {
            const at = ri(rng, 0, s.length);
            s = s.slice(0, at) + "abc" + s.slice(at);
          }
          if (rng() < 0.3 && s.length > 1) {
            // Perturb some of them so the answer is not always true.
            const at = ri(rng, 0, s.length - 1);
            s = s.slice(0, at) + pick(rng, ["a", "b", "c"]) + s.slice(at + 1);
          }
        } else {
          s = randStr(rng, 1, 40, "abc");
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def isValid(s: str) -> bool:\n    stack = []\n    for ch in s:\n        if ch == "c":\n            if len(stack) < 2:\n                return False\n            b = stack.pop()\n            a = stack.pop()\n            if a != "a" or b != "b":\n                return False\n        else:\n            stack.append(ch)\n    return len(stack) == 0`,
        javascript: `var isValid = function(s) {\n    const stack = [];\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (c === "c") {\n            if (stack.length < 2) return false;\n            const b = stack.pop();\n            const a = stack.pop();\n            if (a !== "a" || b !== "b") return false;\n        } else {\n            stack.push(c);\n        }\n    }\n    return stack.length === 0;\n};`,
              typescript: `function isValid(s: string): boolean {\n    var stack: string[] = [];\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "c") {\n            if (stack.length < 2) return false;\n            var b = stack.pop();\n            var a = stack.pop();\n            if (a !== "a" || b !== "b") return false;\n        } else {\n            stack.push(c);\n        }\n    }\n    return stack.length === 0;\n}`,
              java: `public static boolean isValid(String s) {\n    Deque<Character> stack = new ArrayDeque<>();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == 'c') {\n            if (stack.size() < 2) return false;\n            char b = stack.pop();\n            char a = stack.pop();\n            if (a != 'a' || b != 'b') return false;\n        } else {\n            stack.push(c);\n        }\n    }\n    return stack.isEmpty();\n}`,
              cpp: `bool isValid(string s) {\n    vector<char> stack;\n    for (char c : s) {\n        if (c == 'c') {\n            if (stack.size() < 2) return false;\n            char b = stack.back();\n            stack.pop_back();\n            char a = stack.back();\n            stack.pop_back();\n            if (a != 'a' || b != 'b') return false;\n        } else {\n            stack.push_back(c);\n        }\n    }\n    return stack.empty();\n}`,
              c: `bool isValid(const char* s) {\n    int n = (int) strlen(s);\n    char* stack = (char*) malloc((size_t) n + 1);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == 'c') {\n            if (top < 2) {\n                free(stack);\n                return false;\n            }\n            char b = stack[--top];\n            char a = stack[--top];\n            if (a != 'a' || b != 'b') {\n                free(stack);\n                return false;\n            }\n        } else {\n            stack[top++] = s[i];\n        }\n    }\n    bool ok = (top == 0);\n    free(stack);\n    return ok;\n}`,
              csharp: `public static bool IsValid(string s)\n{\n    var stack = new List<char>();\n    foreach (char c in s)\n    {\n        if (c == 'c')\n        {\n            if (stack.Count < 2) return false;\n            char b = stack[stack.Count - 1];\n            stack.RemoveAt(stack.Count - 1);\n            char a = stack[stack.Count - 1];\n            stack.RemoveAt(stack.Count - 1);\n            if (a != 'a' || b != 'b') return false;\n        }\n        else\n        {\n            stack.Add(c);\n        }\n    }\n    return stack.Count == 0;\n}`,
              go: `func isValid(s string) bool {\n	stack := []byte{}\n	for i := 0; i < len(s); i++ {\n		if s[i] == 'c' {\n			if len(stack) < 2 {\n				return false\n			}\n			b := stack[len(stack)-1]\n			a := stack[len(stack)-2]\n			stack = stack[:len(stack)-2]\n			if a != 'a' || b != 'b' {\n				return false\n			}\n		} else {\n			stack = append(stack, s[i])\n		}\n	}\n	return len(stack) == 0\n}`,
              kotlin: `fun isValid(s: String): Boolean {\n    val stack = ArrayList<Char>()\n    for (c in s) {\n        if (c == 'c') {\n            if (stack.size < 2) return false\n            val b = stack.removeAt(stack.size - 1)\n            val a = stack.removeAt(stack.size - 1)\n            if (a != 'a' || b != 'b') return false\n        } else {\n            stack.add(c)\n        }\n    }\n    return stack.isEmpty()\n}`,
              swift: `func isValid(_ s: String) -> Bool {\n    var stack: [Character] = []\n    for c in s {\n        if c == "c" {\n            if stack.count < 2 { return false }\n            let b = stack.removeLast()\n            let a = stack.removeLast()\n            if a != "a" || b != "b" { return false }\n        } else {\n            stack.append(c)\n        }\n    }\n    return stack.isEmpty\n}`,
              rust: `fn isValid(s: String) -> bool {\n    let mut stack: Vec<u8> = Vec::new();\n    for c in s.bytes() {\n        if c == b'c' {\n            if stack.len() < 2 {\n                return false;\n            }\n            let b = stack.pop().unwrap();\n            let a = stack.pop().unwrap();\n            if a != b'a' || b != b'b' {\n                return false;\n            }\n        } else {\n            stack.push(c);\n        }\n    }\n    stack.is_empty()\n}`,
              php: `function isValid($s) {\n    $stack = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        if ($c === "c") {\n            if (count($stack) < 2) return false;\n            $b = array_pop($stack);\n            $a = array_pop($stack);\n            if ($a !== "a" || $b !== "b") return false;\n        } else {\n            $stack[] = $c;\n        }\n    }\n    return count($stack) === 0;\n}`,
              ruby: `def isValid(s)\n  stack = []\n  s.each_char do |c|\n    if c == "c"\n      return false if stack.length < 2\n      b = stack.pop\n      a = stack.pop\n      return false if a != "a" || b != "b"\n    else\n      stack.push(c)\n    end\n  end\n  stack.empty?\nend`,
      },
    };
  })(),

  // ── Crawler Log Folder ──────────────────────────────────────────
  (() => {
    const ref = (logs: string[]) => {
      let depth = 0;
      for (let i = 0; i < logs.length; i++) {
        const op = logs[i];
        if (op === "../") {
          if (depth > 0) depth--;
        } else if (op !== "./") depth++;
      }
      return depth;
    };
    return {
      slug: "crawler-log-folder",
      title: "Crawler Log Folder",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Stack", "Amazon", "Adobe"],
      signature: { funcName: "minOperations", params: [{ name: "logs", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "The file system starts in the main folder. You are given a change-folder log where each entry is one of:\n\n- `\"../\"` — move to the parent folder, or stay put if already in the main folder;\n- `\"./\"` — stay in the current folder;\n- `\"x/\"` — move into the child folder named `x`.\n\nReturn the minimum number of `\"../\"` operations needed to get back to the main folder.",
        [
          { in: 'logs = ["d1/","d2/","../","d21/","./"]', out: "2" },
          { in: 'logs = ["d1/","d2/","./","d3/","../","d31/"]', out: "3" },
          { in: 'logs = ["d1/","../","../","../"]', out: "0" },
        ],
        ["1 <= logs.length <= 30", 'Each entry is "../", "./", or a folder name followed by "/".']),
      hints: [
        "Only the current depth matters, not the folder names.",
        "`\"x/\"` increases the depth, `\"../\"` decreases it, `\"./\"` leaves it alone.",
        "The depth can never go below zero — `\"../\"` in the main folder does nothing.",
      ],
      examples: [
        { input: '["d1/","d2/","../","d21/","./"]', expectedOutput: "2" },
        { input: '["d1/","d2/","./","d3/","../","d31/"]', expectedOutput: "3" },
        { input: '["d1/","../","../","../"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const names = ["d1/", "d2/", "d3/", "d21/", "d31/", "a/", "b/"];
        const logs = Array.from({ length: ri(rng, 1, 30) }, () => {
          const roll = rng();
          if (roll < 0.3) return "../";
          if (roll < 0.45) return "./";
          return pick(rng, names);
        });
        return { input: fmtStrArr(logs), expectedOutput: String(ref(logs)) };
      },
      solutions: {
        python: `def minOperations(logs) -> int:\n    depth = 0\n    for op in logs:\n        if op == "../":\n            depth = max(0, depth - 1)\n        elif op != "./":\n            depth += 1\n    return depth`,
        javascript: `var minOperations = function(logs) {\n    let depth = 0;\n    for (let i = 0; i < logs.length; i++) {\n        const op = logs[i];\n        if (op === "../") {\n            if (depth > 0) depth--;\n        } else if (op !== "./") {\n            depth++;\n        }\n    }\n    return depth;\n};`,
              typescript: `function minOperations(logs: string[]): number {\n    var depth = 0;\n    for (var i = 0; i < logs.length; i++) {\n        var op = logs[i];\n        if (op === "../") {\n            if (depth > 0) depth--;\n        } else if (op !== "./") {\n            depth++;\n        }\n    }\n    return depth;\n}`,
              java: `public static int minOperations(String[] logs) {\n    int depth = 0;\n    for (String op : logs) {\n        if (op.equals("../")) {\n            if (depth > 0) depth--;\n        } else if (!op.equals("./")) {\n            depth++;\n        }\n    }\n    return depth;\n}`,
              cpp: `int minOperations(vector<string>& logs) {\n    int depth = 0;\n    for (const string& op : logs) {\n        if (op == "../") {\n            if (depth > 0) depth--;\n        } else if (op != "./") {\n            depth++;\n        }\n    }\n    return depth;\n}`,
              c: `int minOperations(char** logs, int logsSize) {\n    int depth = 0;\n    for (int i = 0; i < logsSize; i++) {\n        if (strcmp(logs[i], "../") == 0) {\n            if (depth > 0) depth--;\n        } else if (strcmp(logs[i], "./") != 0) {\n            depth++;\n        }\n    }\n    return depth;\n}`,
              csharp: `public static int MinOperations(string[] logs)\n{\n    int depth = 0;\n    foreach (string op in logs)\n    {\n        if (op == "../")\n        {\n            if (depth > 0) depth--;\n        }\n        else if (op != "./")\n        {\n            depth++;\n        }\n    }\n    return depth;\n}`,
              go: `func minOperations(logs []string) int {\n	depth := 0\n	for _, op := range logs {\n		if op == "../" {\n			if depth > 0 {\n				depth--\n			}\n		} else if op != "./" {\n			depth++\n		}\n	}\n	return depth\n}`,
              kotlin: `fun minOperations(logs: Array<String>): Int {\n    var depth = 0\n    for (op in logs) {\n        if (op == "../") {\n            if (depth > 0) depth--\n        } else if (op != "./") {\n            depth++\n        }\n    }\n    return depth\n}`,
              swift: `func minOperations(_ logs: [String]) -> Int {\n    var depth = 0\n    for op in logs {\n        if op == "../" {\n            if depth > 0 { depth -= 1 }\n        } else if op != "./" {\n            depth += 1\n        }\n    }\n    return depth\n}`,
              rust: `fn minOperations(logs: Vec<String>) -> i32 {\n    let mut depth = 0;\n    for op in logs.iter() {\n        if op == "../" {\n            if depth > 0 {\n                depth -= 1;\n            }\n        } else if op != "./" {\n            depth += 1;\n        }\n    }\n    depth\n}`,
              php: `function minOperations($logs) {\n    $depth = 0;\n    foreach ($logs as $op) {\n        if ($op === "../") {\n            if ($depth > 0) $depth--;\n        } else if ($op !== "./") {\n            $depth++;\n        }\n    }\n    return $depth;\n}`,
              ruby: `def minOperations(logs)\n  depth = 0\n  logs.each do |op|\n    if op == "../"\n      depth -= 1 if depth > 0\n    elsif op != "./"\n      depth += 1\n    end\n  end\n  depth\nend`,
      },
    };
  })(),

  // ── Build an Array With Stack Operations ────────────────────────
  (() => {
    const ref = (target: number[], n: number) => {
      const out: string[] = [];
      let value = 1;
      for (let i = 0; i < target.length; i++) {
        while (value < target[i]) {
          out.push("Push");
          out.push("Pop");
          value++;
        }
        out.push("Push");
        value++;
      }
      return out;
    };
    return {
      slug: "build-an-array-with-stack-operations",
      title: "Build an Array With Stack Operations",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "buildArray", params: [{ name: "target", type: "int[]" as const }, { name: "n", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "You are given a strictly increasing array `target` and an integer `n`. A stream reads the integers `1, 2, …, n` in order, and you build a stack with two operations:\n\n- `\"Push\"` — push the next integer from the stream;\n- `\"Pop\"` — remove the top of the stack.\n\nReturn the shortest sequence of operations that leaves the stack equal to `target`. Stop as soon as the stack matches.",
        [
          { in: "target = [1,3], n = 3", out: '["Push","Push","Pop","Push"]', note: "Read 1, then read 2 and discard it, then read 3." },
          { in: "target = [1,2,3], n = 3", out: '["Push","Push","Push"]' },
          { in: "target = [1,2], n = 4", out: '["Push","Push"]' },
        ],
        ["1 <= target.length <= 30", "1 <= target[i] <= n <= 40", "target is strictly increasing."]),
      hints: [
        "Walk the stream from 1 upward, keeping a pointer into `target`.",
        "Every number that is not the next target value is pushed and immediately popped.",
        "Stop the moment the last target value has been pushed — trailing operations are never needed.",
      ],
      examples: [
        { input: "[1,3]\n3", expectedOutput: '["Push","Push","Pop","Push"]' },
        { input: "[1,2,3]\n3", expectedOutput: '["Push","Push","Push"]' },
        { input: "[1,2]\n4", expectedOutput: '["Push","Push"]' },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const size = ri(rng, 1, Math.min(n, 30));
        const chosen = new Set<number>();
        while (chosen.size < size) chosen.add(ri(rng, 1, n));
        const target = Array.from(chosen).sort((a, b) => a - b);
        return { input: `${fmtIntArr(target)}\n${n}`, expectedOutput: fmtStrArr(ref(target, n)) };
      },
      solutions: {
        python: `def buildArray(target, n: int):\n    out = []\n    value = 1\n    for want in target:\n        while value < want:\n            out.append("Push")\n            out.append("Pop")\n            value += 1\n        out.append("Push")\n        value += 1\n    return out`,
        javascript: `var buildArray = function(target, n) {\n    const out = [];\n    let value = 1;\n    for (let i = 0; i < target.length; i++) {\n        while (value < target[i]) {\n            out.push("Push");\n            out.push("Pop");\n            value++;\n        }\n        out.push("Push");\n        value++;\n    }\n    return out;\n};`,
              typescript: `function buildArray(target: number[], n: number): string[] {\n    var out: string[] = [];\n    var value = 1;\n    for (var i = 0; i < target.length; i++) {\n        while (value < target[i]) {\n            out.push("Push");\n            out.push("Pop");\n            value++;\n        }\n        out.push("Push");\n        value++;\n    }\n    return out;\n}`,
              java: `public static String[] buildArray(int[] target, int n) {\n    List<String> out = new ArrayList<>();\n    int value = 1;\n    for (int want : target) {\n        while (value < want) {\n            out.add("Push");\n            out.add("Pop");\n            value++;\n        }\n        out.add("Push");\n        value++;\n    }\n    return out.toArray(new String[0]);\n}`,
              cpp: `vector<string> buildArray(vector<int>& target, int n) {\n    vector<string> out;\n    int value = 1;\n    for (int want : target) {\n        while (value < want) {\n            out.push_back("Push");\n            out.push_back("Pop");\n            value++;\n        }\n        out.push_back("Push");\n        value++;\n    }\n    return out;\n}`,
              c: `char** buildArray(int* target, int targetSize, int n, int* returnSize) {\n    char** out = (char**) malloc((size_t) (2 * n + 2) * sizeof(char*));\n    int m = 0;\n    int value = 1;\n    for (int i = 0; i < targetSize; i++) {\n        while (value < target[i]) {\n            out[m] = (char*) malloc(8);\n            strcpy(out[m++], "Push");\n            out[m] = (char*) malloc(8);\n            strcpy(out[m++], "Pop");\n            value++;\n        }\n        out[m] = (char*) malloc(8);\n        strcpy(out[m++], "Push");\n        value++;\n    }\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static string[] BuildArray(int[] target, int n)\n{\n    var out_ = new List<string>();\n    int value = 1;\n    foreach (int want in target)\n    {\n        while (value < want)\n        {\n            out_.Add("Push");\n            out_.Add("Pop");\n            value++;\n        }\n        out_.Add("Push");\n        value++;\n    }\n    return out_.ToArray();\n}`,
              go: `func buildArray(target []int, n int) []string {\n	out := []string{}\n	value := 1\n	for _, want := range target {\n		for value < want {\n			out = append(out, "Push", "Pop")\n			value++\n		}\n		out = append(out, "Push")\n		value++\n	}\n	return out\n}`,
              kotlin: `fun buildArray(target: IntArray, n: Int): Array<String> {\n    val out = ArrayList<String>()\n    var value = 1\n    for (want in target) {\n        while (value < want) {\n            out.add("Push")\n            out.add("Pop")\n            value++\n        }\n        out.add("Push")\n        value++\n    }\n    return out.toTypedArray()\n}`,
              swift: `func buildArray(_ target: [Int], _ n: Int) -> [String] {\n    var out: [String] = []\n    var value = 1\n    for want in target {\n        while value < want {\n            out.append("Push")\n            out.append("Pop")\n            value += 1\n        }\n        out.append("Push")\n        value += 1\n    }\n    return out\n}`,
              rust: `fn buildArray(target: Vec<i32>, n: i32) -> Vec<String> {\n    let mut out: Vec<String> = Vec::new();\n    let mut value = 1;\n    for want in target.iter() {\n        while value < *want {\n            out.push(String::from("Push"));\n            out.push(String::from("Pop"));\n            value += 1;\n        }\n        out.push(String::from("Push"));\n        value += 1;\n    }\n    out\n}`,
              php: `function buildArray($target, $n) {\n    $out = array();\n    $value = 1;\n    foreach ($target as $want) {\n        while ($value < $want) {\n            $out[] = "Push";\n            $out[] = "Pop";\n            $value++;\n        }\n        $out[] = "Push";\n        $value++;\n    }\n    return $out;\n}`,
              ruby: `def buildArray(target, n)\n  out = []\n  value = 1\n  target.each do |want|\n    while value < want\n      out.push("Push")\n      out.push("Pop")\n      value += 1\n    end\n    out.push("Push")\n    value += 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Final Prices With a Special Discount in a Shop ──────────────
  (() => {
    const ref = (prices: number[]) => {
      const out = prices.slice();
      const stack: number[] = [];
      for (let i = 0; i < prices.length; i++) {
        while (stack.length > 0 && prices[stack[stack.length - 1]] >= prices[i]) {
          const j = stack.pop() as number;
          out[j] = prices[j] - prices[i];
        }
        stack.push(i);
      }
      return out;
    };
    return {
      slug: "final-prices-with-a-special-discount-in-a-shop",
      title: "Final Prices With a Special Discount in a Shop",
      difficulty: "EASY" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Adobe"],
      signature: { funcName: "finalPrices", params: [{ name: "prices", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `prices` where `prices[i]` is the price of the i-th item.\n\nBuying item `i` earns a discount equal to `prices[j]`, where `j` is the **smallest** index greater than `i` with `prices[j] <= prices[i]`. If no such `j` exists, there is no discount.\n\nReturn the array of prices actually paid.",
        [
          { in: "prices = [8,4,6,2,3]", out: "[4,2,4,2,3]" },
          { in: "prices = [1,2,3,4,5]", out: "[1,2,3,4,5]", note: "No item has a cheaper item after it." },
          { in: "prices = [10,1,1,6]", out: "[9,0,1,6]" },
        ],
        ["1 <= prices.length <= 40", "1 <= prices[i] <= 1000"]),
      hints: [
        "This is the classic \"next smaller or equal element\" problem.",
        "Keep a stack of indices whose discount is still unknown, with prices increasing from bottom to top.",
        "When a new price arrives, it discounts every index on the stack whose price is at least as large.",
      ],
      examples: [
        { input: "[8,4,6,2,3]", expectedOutput: "[4,2,4,2,3]" },
        { input: "[1,2,3,4,5]", expectedOutput: "[1,2,3,4,5]" },
        { input: "[10,1,1,6]", expectedOutput: "[9,0,1,6]" },
      ],
      gen: (rng: Rng) => {
        const prices = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.5 ? 10 : 1000);
        return { input: fmtIntArr(prices), expectedOutput: fmtIntArr(ref(prices)) };
      },
      solutions: {
        python: `def finalPrices(prices):\n    out = list(prices)\n    stack = []\n    for i, price in enumerate(prices):\n        while stack and prices[stack[-1]] >= price:\n            j = stack.pop()\n            out[j] = prices[j] - price\n        stack.append(i)\n    return out`,
        javascript: `var finalPrices = function(prices) {\n    const out = prices.slice();\n    const stack = [];\n    for (let i = 0; i < prices.length; i++) {\n        while (stack.length > 0 && prices[stack[stack.length - 1]] >= prices[i]) {\n            const j = stack.pop();\n            out[j] = prices[j] - prices[i];\n        }\n        stack.push(i);\n    }\n    return out;\n};`,
              typescript: `function finalPrices(prices: number[]): number[] {\n    var out = prices.slice();\n    var stack: number[] = [];\n    for (var i = 0; i < prices.length; i++) {\n        while (stack.length > 0 && prices[stack[stack.length - 1]] >= prices[i]) {\n            var j = stack.pop() as number;\n            out[j] = prices[j] - prices[i];\n        }\n        stack.push(i);\n    }\n    return out;\n}`,
              java: `public static int[] finalPrices(int[] prices) {\n    int[] out = prices.clone();\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < prices.length; i++) {\n        while (!stack.isEmpty() && prices[stack.peek()] >= prices[i]) {\n            int j = stack.pop();\n            out[j] = prices[j] - prices[i];\n        }\n        stack.push(i);\n    }\n    return out;\n}`,
              cpp: `vector<int> finalPrices(vector<int>& prices) {\n    vector<int> out = prices;\n    vector<int> stack;\n    for (int i = 0; i < (int) prices.size(); i++) {\n        while (!stack.empty() && prices[stack.back()] >= prices[i]) {\n            int j = stack.back();\n            stack.pop_back();\n            out[j] = prices[j] - prices[i];\n        }\n        stack.push_back(i);\n    }\n    return out;\n}`,
              c: `int* finalPrices(int* prices, int pricesSize, int* returnSize) {\n    int* out = (int*) malloc((size_t) (pricesSize > 0 ? pricesSize : 1) * sizeof(int));\n    for (int i = 0; i < pricesSize; i++) out[i] = prices[i];\n    int* stack = (int*) malloc((size_t) (pricesSize > 0 ? pricesSize : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < pricesSize; i++) {\n        while (top > 0 && prices[stack[top - 1]] >= prices[i]) {\n            int j = stack[--top];\n            out[j] = prices[j] - prices[i];\n        }\n        stack[top++] = i;\n    }\n    free(stack);\n    *returnSize = pricesSize;\n    return out;\n}`,
              csharp: `public static int[] FinalPrices(int[] prices)\n{\n    int[] out_ = (int[]) prices.Clone();\n    var stack = new List<int>();\n    for (int i = 0; i < prices.Length; i++)\n    {\n        while (stack.Count > 0 && prices[stack[stack.Count - 1]] >= prices[i])\n        {\n            int j = stack[stack.Count - 1];\n            stack.RemoveAt(stack.Count - 1);\n            out_[j] = prices[j] - prices[i];\n        }\n        stack.Add(i);\n    }\n    return out_;\n}`,
              go: `func finalPrices(prices []int) []int {\n	out := append([]int{}, prices...)\n	stack := []int{}\n	for i := 0; i < len(prices); i++ {\n		for len(stack) > 0 && prices[stack[len(stack)-1]] >= prices[i] {\n			j := stack[len(stack)-1]\n			stack = stack[:len(stack)-1]\n			out[j] = prices[j] - prices[i]\n		}\n		stack = append(stack, i)\n	}\n	return out\n}`,
              kotlin: `fun finalPrices(prices: IntArray): IntArray {\n    val out = prices.copyOf()\n    val stack = ArrayList<Int>()\n    for (i in prices.indices) {\n        while (stack.isNotEmpty() && prices[stack[stack.size - 1]] >= prices[i]) {\n            val j = stack.removeAt(stack.size - 1)\n            out[j] = prices[j] - prices[i]\n        }\n        stack.add(i)\n    }\n    return out\n}`,
              swift: `func finalPrices(_ prices: [Int]) -> [Int] {\n    var out = prices\n    var stack: [Int] = []\n    for i in 0..<prices.count {\n        while let top = stack.last, prices[top] >= prices[i] {\n            stack.removeLast()\n            out[top] = prices[top] - prices[i]\n        }\n        stack.append(i)\n    }\n    return out\n}`,
              rust: `fn finalPrices(prices: Vec<i32>) -> Vec<i32> {\n    let mut out = prices.clone();\n    let mut stack: Vec<usize> = Vec::new();\n    for i in 0..prices.len() {\n        while let Some(&top) = stack.last() {\n            if prices[top] >= prices[i] {\n                stack.pop();\n                out[top] = prices[top] - prices[i];\n            } else {\n                break;\n            }\n        }\n        stack.push(i);\n    }\n    out\n}`,
              php: `function finalPrices($prices) {\n    $out = $prices;\n    $stack = array();\n    $n = count($prices);\n    for ($i = 0; $i < $n; $i++) {\n        while (count($stack) > 0 && $prices[$stack[count($stack) - 1]] >= $prices[$i]) {\n            $j = array_pop($stack);\n            $out[$j] = $prices[$j] - $prices[$i];\n        }\n        $stack[] = $i;\n    }\n    return $out;\n}`,
              ruby: `def finalPrices(prices)\n  out = prices.dup\n  stack = []\n  prices.each_with_index do |price, i|\n    while !stack.empty? && prices[stack[-1]] >= price\n      j = stack.pop\n      out[j] = prices[j] - price\n    end\n    stack.push(i)\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Sum of Subarray Minimums ────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const MOD = 1000000007;
      const n = arr.length;
      const left: number[] = [];
      const right: number[] = [];
      for (let i = 0; i < n; i++) {
        left.push(0);
        right.push(0);
      }
      const stack: number[] = [];
      for (let i = 0; i < n; i++) {
        while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[i]) stack.pop();
        left[i] = stack.length === 0 ? i + 1 : i - stack[stack.length - 1];
        stack.push(i);
      }
      stack.length = 0;
      for (let i = n - 1; i >= 0; i--) {
        while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[i]) stack.pop();
        right[i] = stack.length === 0 ? n - i : stack[stack.length - 1] - i;
        stack.push(i);
      }
      let total = 0;
      for (let i = 0; i < n; i++) total = (total + arr[i] * left[i] * right[i]) % MOD;
      return total;
    };
    return {
      slug: "sum-of-subarray-minimums",
      title: "Sum of Subarray Minimums",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Stack", "Monotonic Stack", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "sumSubarrayMins", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of integers `arr`, return the sum of `min(b)` over every contiguous non-empty subarray `b` of `arr`.\n\nBecause the answer can be large, return it **modulo `10^9 + 7`**.",
        [
          { in: "arr = [3,1,2,4]", out: "17", note: "The minima are 3,1,2,4,1,1,2,1,1,1 — summing to 17." },
          { in: "arr = [11,81,94,43,3]", out: "444" },
          { in: "arr = [1]", out: "1" },
        ],
        ["1 <= arr.length <= 100", "1 <= arr[i] <= 10000"],
        "The brute force is O(n²). Can you count each element's contribution in O(n) with a monotonic stack?"),
      hints: [
        "Instead of enumerating subarrays, ask how many subarrays each element is the minimum of.",
        "For index `i`, let `left[i]` be the number of choices for the subarray's start and `right[i]` the choices for its end; the contribution is `arr[i] * left[i] * right[i]`.",
        "Use a strict comparison on one side and a non-strict one on the other so equal values are not double counted.",
      ],
      examples: [
        { input: "[3,1,2,4]", expectedOutput: "17" },
        { input: "[11,81,94,43,3]", expectedOutput: "444" },
        { input: "[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 1, 100), 1, rng() < 0.5 ? 12 : 10000);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `def sumSubarrayMins(arr) -> int:\n    MOD = 1000000007\n    n = len(arr)\n    left = [0] * n\n    right = [0] * n\n    stack = []\n    for i in range(n):\n        while stack and arr[stack[-1]] > arr[i]:\n            stack.pop()\n        left[i] = i + 1 if not stack else i - stack[-1]\n        stack.append(i)\n    stack = []\n    for i in range(n - 1, -1, -1):\n        while stack and arr[stack[-1]] >= arr[i]:\n            stack.pop()\n        right[i] = n - i if not stack else stack[-1] - i\n        stack.append(i)\n    total = 0\n    for i in range(n):\n        total = (total + arr[i] * left[i] * right[i]) % MOD\n    return total`,
        javascript: `var sumSubarrayMins = function(arr) {\n    const MOD = 1000000007;\n    const n = arr.length;\n    const left = [], right = [];\n    for (let i = 0; i < n; i++) {\n        left.push(0);\n        right.push(0);\n    }\n    let stack = [];\n    for (let i = 0; i < n; i++) {\n        while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[i]) stack.pop();\n        left[i] = stack.length === 0 ? i + 1 : i - stack[stack.length - 1];\n        stack.push(i);\n    }\n    stack = [];\n    for (let i = n - 1; i >= 0; i--) {\n        while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[i]) stack.pop();\n        right[i] = stack.length === 0 ? n - i : stack[stack.length - 1] - i;\n        stack.push(i);\n    }\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        total = (total + arr[i] * left[i] * right[i]) % MOD;\n    }\n    return total;\n};`,
              typescript: `function sumSubarrayMins(arr: number[]): number {\n    var MOD = 1000000007;\n    var n = arr.length;\n    var left: number[] = [];\n    var right: number[] = [];\n    for (var i = 0; i < n; i++) {\n        left.push(0);\n        right.push(0);\n    }\n    var stack: number[] = [];\n    for (var a = 0; a < n; a++) {\n        while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[a]) stack.pop();\n        left[a] = stack.length === 0 ? a + 1 : a - stack[stack.length - 1];\n        stack.push(a);\n    }\n    stack = [];\n    for (var b = n - 1; b >= 0; b--) {\n        while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[b]) stack.pop();\n        right[b] = stack.length === 0 ? n - b : stack[stack.length - 1] - b;\n        stack.push(b);\n    }\n    var total = 0;\n    for (var c = 0; c < n; c++) total = (total + arr[c] * left[c] * right[c]) % MOD;\n    return total;\n}`,
              java: `public static int sumSubarrayMins(int[] arr) {\n    final int MOD = 1000000007;\n    int n = arr.length;\n    int[] left = new int[n];\n    int[] right = new int[n];\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        while (!stack.isEmpty() && arr[stack.peek()] > arr[i]) stack.pop();\n        left[i] = stack.isEmpty() ? i + 1 : i - stack.peek();\n        stack.push(i);\n    }\n    stack.clear();\n    for (int i = n - 1; i >= 0; i--) {\n        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i]) stack.pop();\n        right[i] = stack.isEmpty() ? n - i : stack.peek() - i;\n        stack.push(i);\n    }\n    long total = 0;\n    for (int i = 0; i < n; i++) {\n        total = (total + (long) arr[i] * left[i] * right[i]) % MOD;\n    }\n    return (int) total;\n}`,
              cpp: `int sumSubarrayMins(vector<int>& arr) {\n    const long long MOD = 1000000007LL;\n    int n = (int) arr.size();\n    vector<int> left(n, 0), right(n, 0);\n    vector<int> stack;\n    for (int i = 0; i < n; i++) {\n        while (!stack.empty() && arr[stack.back()] > arr[i]) stack.pop_back();\n        left[i] = stack.empty() ? i + 1 : i - stack.back();\n        stack.push_back(i);\n    }\n    stack.clear();\n    for (int i = n - 1; i >= 0; i--) {\n        while (!stack.empty() && arr[stack.back()] >= arr[i]) stack.pop_back();\n        right[i] = stack.empty() ? n - i : stack.back() - i;\n        stack.push_back(i);\n    }\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        total = (total + (long long) arr[i] * left[i] * right[i]) % MOD;\n    }\n    return (int) total;\n}`,
              c: `int sumSubarrayMins(int* arr, int arrSize) {\n    const long long MOD = 1000000007LL;\n    int n = arrSize;\n    int* left = (int*) calloc((size_t) (n > 0 ? n : 1), sizeof(int));\n    int* right = (int*) calloc((size_t) (n > 0 ? n : 1), sizeof(int));\n    int* stack = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        while (top > 0 && arr[stack[top - 1]] > arr[i]) top--;\n        left[i] = (top == 0) ? i + 1 : i - stack[top - 1];\n        stack[top++] = i;\n    }\n    top = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        while (top > 0 && arr[stack[top - 1]] >= arr[i]) top--;\n        right[i] = (top == 0) ? n - i : stack[top - 1] - i;\n        stack[top++] = i;\n    }\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        total = (total + (long long) arr[i] * left[i] * right[i]) % MOD;\n    }\n    free(left);\n    free(right);\n    free(stack);\n    return (int) total;\n}`,
              csharp: `public static int SumSubarrayMins(int[] arr)\n{\n    const long MOD = 1000000007L;\n    int n = arr.Length;\n    int[] left = new int[n];\n    int[] right = new int[n];\n    var stack = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        while (stack.Count > 0 && arr[stack[stack.Count - 1]] > arr[i]) stack.RemoveAt(stack.Count - 1);\n        left[i] = stack.Count == 0 ? i + 1 : i - stack[stack.Count - 1];\n        stack.Add(i);\n    }\n    stack.Clear();\n    for (int i = n - 1; i >= 0; i--)\n    {\n        while (stack.Count > 0 && arr[stack[stack.Count - 1]] >= arr[i]) stack.RemoveAt(stack.Count - 1);\n        right[i] = stack.Count == 0 ? n - i : stack[stack.Count - 1] - i;\n        stack.Add(i);\n    }\n    long total = 0;\n    for (int i = 0; i < n; i++)\n    {\n        total = (total + (long) arr[i] * left[i] * right[i]) % MOD;\n    }\n    return (int) total;\n}`,
              go: `func sumSubarrayMins(arr []int) int {\n	const MOD = 1000000007\n	n := len(arr)\n	left := make([]int, n)\n	right := make([]int, n)\n	stack := []int{}\n	for i := 0; i < n; i++ {\n		for len(stack) > 0 && arr[stack[len(stack)-1]] > arr[i] {\n			stack = stack[:len(stack)-1]\n		}\n		if len(stack) == 0 {\n			left[i] = i + 1\n		} else {\n			left[i] = i - stack[len(stack)-1]\n		}\n		stack = append(stack, i)\n	}\n	stack = []int{}\n	for i := n - 1; i >= 0; i-- {\n		for len(stack) > 0 && arr[stack[len(stack)-1]] >= arr[i] {\n			stack = stack[:len(stack)-1]\n		}\n		if len(stack) == 0 {\n			right[i] = n - i\n		} else {\n			right[i] = stack[len(stack)-1] - i\n		}\n		stack = append(stack, i)\n	}\n	total := 0\n	for i := 0; i < n; i++ {\n		total = (total + arr[i]*left[i]*right[i]) % MOD\n	}\n	return total\n}`,
              kotlin: `fun sumSubarrayMins(arr: IntArray): Int {\n    val MOD = 1000000007L\n    val n = arr.size\n    val left = IntArray(n)\n    val right = IntArray(n)\n    val stack = ArrayList<Int>()\n    for (i in 0 until n) {\n        while (stack.isNotEmpty() && arr[stack[stack.size - 1]] > arr[i]) stack.removeAt(stack.size - 1)\n        left[i] = if (stack.isEmpty()) i + 1 else i - stack[stack.size - 1]\n        stack.add(i)\n    }\n    stack.clear()\n    for (i in n - 1 downTo 0) {\n        while (stack.isNotEmpty() && arr[stack[stack.size - 1]] >= arr[i]) stack.removeAt(stack.size - 1)\n        right[i] = if (stack.isEmpty()) n - i else stack[stack.size - 1] - i\n        stack.add(i)\n    }\n    var total = 0L\n    for (i in 0 until n) {\n        total = (total + arr[i].toLong() * left[i] * right[i]) % MOD\n    }\n    return total.toInt()\n}`,
              swift: `func sumSubarrayMins(_ arr: [Int]) -> Int {\n    let MOD = 1000000007\n    let n = arr.count\n    var left = [Int](repeating: 0, count: n)\n    var right = [Int](repeating: 0, count: n)\n    var stack: [Int] = []\n    for i in 0..<n {\n        while let top = stack.last, arr[top] > arr[i] { stack.removeLast() }\n        left[i] = stack.isEmpty ? i + 1 : i - stack[stack.count - 1]\n        stack.append(i)\n    }\n    stack.removeAll()\n    var i = n - 1\n    while i >= 0 {\n        while let top = stack.last, arr[top] >= arr[i] { stack.removeLast() }\n        right[i] = stack.isEmpty ? n - i : stack[stack.count - 1] - i\n        stack.append(i)\n        i -= 1\n    }\n    var total = 0\n    for j in 0..<n {\n        total = (total + arr[j] * left[j] * right[j]) % MOD\n    }\n    return total\n}`,
              rust: `fn sumSubarrayMins(arr: Vec<i32>) -> i32 {\n    let md: i64 = 1000000007;\n    let n = arr.len();\n    let mut left = vec![0i64; n];\n    let mut right = vec![0i64; n];\n    let mut stack: Vec<usize> = Vec::new();\n    for i in 0..n {\n        while let Some(&top) = stack.last() {\n            if arr[top] > arr[i] { stack.pop(); } else { break; }\n        }\n        left[i] = match stack.last() {\n            None => (i + 1) as i64,\n            Some(&top) => (i - top) as i64,\n        };\n        stack.push(i);\n    }\n    stack.clear();\n    for i in (0..n).rev() {\n        while let Some(&top) = stack.last() {\n            if arr[top] >= arr[i] { stack.pop(); } else { break; }\n        }\n        right[i] = match stack.last() {\n            None => (n - i) as i64,\n            Some(&top) => (top - i) as i64,\n        };\n        stack.push(i);\n    }\n    let mut total: i64 = 0;\n    for i in 0..n {\n        total = (total + arr[i] as i64 * left[i] * right[i]) % md;\n    }\n    total as i32\n}`,
              php: `function sumSubarrayMins($arr) {\n    $MOD = 1000000007;\n    $n = count($arr);\n    $left = array_fill(0, $n, 0);\n    $right = array_fill(0, $n, 0);\n    $stack = array();\n    for ($i = 0; $i < $n; $i++) {\n        while (count($stack) > 0 && $arr[$stack[count($stack) - 1]] > $arr[$i]) array_pop($stack);\n        $left[$i] = count($stack) === 0 ? $i + 1 : $i - $stack[count($stack) - 1];\n        $stack[] = $i;\n    }\n    $stack = array();\n    for ($i = $n - 1; $i >= 0; $i--) {\n        while (count($stack) > 0 && $arr[$stack[count($stack) - 1]] >= $arr[$i]) array_pop($stack);\n        $right[$i] = count($stack) === 0 ? $n - $i : $stack[count($stack) - 1] - $i;\n        $stack[] = $i;\n    }\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $total = ($total + $arr[$i] * $left[$i] * $right[$i]) % $MOD;\n    }\n    return $total;\n}`,
              ruby: `def sumSubarrayMins(arr)\n  mod = 1000000007\n  n = arr.length\n  left = Array.new(n, 0)\n  right = Array.new(n, 0)\n  stack = []\n  (0...n).each do |i|\n    stack.pop while !stack.empty? && arr[stack[-1]] > arr[i]\n    left[i] = stack.empty? ? i + 1 : i - stack[-1]\n    stack.push(i)\n  end\n  stack = []\n  (n - 1).downto(0) do |i|\n    stack.pop while !stack.empty? && arr[stack[-1]] >= arr[i]\n    right[i] = stack.empty? ? n - i : stack[-1] - i\n    stack.push(i)\n  end\n  total = 0\n  (0...n).each { |i| total = (total + arr[i] * left[i] * right[i]) % mod }\n  total\nend`,
      },
    };
  })(),

  // ── 132 Pattern ─────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const stack: number[] = [];
      let third = -Infinity;
      for (let i = nums.length - 1; i >= 0; i--) {
        if (nums[i] < third) return true;
        while (stack.length > 0 && stack[stack.length - 1] < nums[i]) {
          third = stack.pop() as number;
        }
        stack.push(nums[i]);
      }
      return false;
    };
    return {
      slug: "132-pattern",
      title: "132 Pattern",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Stack", "Monotonic Stack", "Ordered Set", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "find132pattern", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "A **132 pattern** is a subsequence `nums[i], nums[j], nums[k]` with `i < j < k` and `nums[i] < nums[k] < nums[j]`.\n\nGiven an integer array `nums`, return `true` if such a pattern exists.",
        [
          { in: "nums = [1,2,3,4]", out: "false", note: "The array is increasing." },
          { in: "nums = [3,1,4,2]", out: "true", note: "1, 4, 2 is a 132 pattern." },
          { in: "nums = [-1,3,2,0]", out: "true" },
        ],
        ["1 <= nums.length <= 40", "-1000000000 <= nums[i] <= 1000000000"]),
      hints: [
        "Scan from the **right** and maintain a decreasing stack of candidates for the `3`.",
        "Whenever a value pops elements off the stack, those popped values are valid candidates for the `2` — keep the largest one seen.",
        "If the current element is smaller than that best `2`, you have found the `1` and the pattern exists.",
      ],
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "false" },
        { input: "[3,1,4,2]", expectedOutput: "true" },
        { input: "[-1,3,2,0]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 12 : 1000000000;
        const nums = randArr(rng, ri(rng, 1, 40), -hi, hi);
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `def find132pattern(nums) -> bool:\n    stack = []\n    third = float("-inf")\n    for x in reversed(nums):\n        if x < third:\n            return True\n        while stack and stack[-1] < x:\n            third = stack.pop()\n        stack.append(x)\n    return False`,
        javascript: `var find132pattern = function(nums) {\n    const stack = [];\n    let third = -Infinity;\n    for (let i = nums.length - 1; i >= 0; i--) {\n        if (nums[i] < third) return true;\n        while (stack.length > 0 && stack[stack.length - 1] < nums[i]) {\n            third = stack.pop();\n        }\n        stack.push(nums[i]);\n    }\n    return false;\n};`,
              typescript: `function find132pattern(nums: number[]): boolean {\n    var stack: number[] = [];\n    var hasThird = false;\n    var third = 0;\n    for (var i = nums.length - 1; i >= 0; i--) {\n        if (hasThird && nums[i] < third) return true;\n        while (stack.length > 0 && stack[stack.length - 1] < nums[i]) {\n            third = stack.pop() as number;\n            hasThird = true;\n        }\n        stack.push(nums[i]);\n    }\n    return false;\n}`,
              java: `public static boolean find132pattern(int[] nums) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    boolean hasThird = false;\n    int third = 0;\n    for (int i = nums.length - 1; i >= 0; i--) {\n        if (hasThird && nums[i] < third) return true;\n        while (!stack.isEmpty() && stack.peek() < nums[i]) {\n            third = stack.pop();\n            hasThird = true;\n        }\n        stack.push(nums[i]);\n    }\n    return false;\n}`,
              cpp: `bool find132pattern(vector<int>& nums) {\n    vector<int> stack;\n    bool hasThird = false;\n    int third = 0;\n    for (int i = (int) nums.size() - 1; i >= 0; i--) {\n        if (hasThird && nums[i] < third) return true;\n        while (!stack.empty() && stack.back() < nums[i]) {\n            third = stack.back();\n            stack.pop_back();\n            hasThird = true;\n        }\n        stack.push_back(nums[i]);\n    }\n    return false;\n}`,
              c: `bool find132pattern(int* nums, int numsSize) {\n    int* stack = (int*) malloc((size_t) (numsSize > 0 ? numsSize : 1) * sizeof(int));\n    int top = 0;\n    bool hasThird = false;\n    int third = 0;\n    for (int i = numsSize - 1; i >= 0; i--) {\n        if (hasThird && nums[i] < third) {\n            free(stack);\n            return true;\n        }\n        while (top > 0 && stack[top - 1] < nums[i]) {\n            third = stack[--top];\n            hasThird = true;\n        }\n        stack[top++] = nums[i];\n    }\n    free(stack);\n    return false;\n}`,
              csharp: `public static bool Find132pattern(int[] nums)\n{\n    var stack = new List<int>();\n    bool hasThird = false;\n    int third = 0;\n    for (int i = nums.Length - 1; i >= 0; i--)\n    {\n        if (hasThird && nums[i] < third) return true;\n        while (stack.Count > 0 && stack[stack.Count - 1] < nums[i])\n        {\n            third = stack[stack.Count - 1];\n            stack.RemoveAt(stack.Count - 1);\n            hasThird = true;\n        }\n        stack.Add(nums[i]);\n    }\n    return false;\n}`,
              go: `func find132pattern(nums []int) bool {\n	stack := []int{}\n	hasThird := false\n	third := 0\n	for i := len(nums) - 1; i >= 0; i-- {\n		if hasThird && nums[i] < third {\n			return true\n		}\n		for len(stack) > 0 && stack[len(stack)-1] < nums[i] {\n			third = stack[len(stack)-1]\n			stack = stack[:len(stack)-1]\n			hasThird = true\n		}\n		stack = append(stack, nums[i])\n	}\n	return false\n}`,
              kotlin: `fun find132pattern(nums: IntArray): Boolean {\n    val stack = ArrayList<Int>()\n    var hasThird = false\n    var third = 0\n    for (i in nums.size - 1 downTo 0) {\n        if (hasThird && nums[i] < third) return true\n        while (stack.isNotEmpty() && stack[stack.size - 1] < nums[i]) {\n            third = stack.removeAt(stack.size - 1)\n            hasThird = true\n        }\n        stack.add(nums[i])\n    }\n    return false\n}`,
              swift: `func find132pattern(_ nums: [Int]) -> Bool {\n    var stack: [Int] = []\n    var hasThird = false\n    var third = 0\n    var i = nums.count - 1\n    while i >= 0 {\n        if hasThird && nums[i] < third { return true }\n        while let top = stack.last, top < nums[i] {\n            third = top\n            stack.removeLast()\n            hasThird = true\n        }\n        stack.append(nums[i])\n        i -= 1\n    }\n    return false\n}`,
              rust: `fn find132pattern(nums: Vec<i32>) -> bool {\n    let mut stack: Vec<i32> = Vec::new();\n    let mut has_third = false;\n    let mut third = 0;\n    for i in (0..nums.len()).rev() {\n        if has_third && nums[i] < third {\n            return true;\n        }\n        while let Some(&top) = stack.last() {\n            if top < nums[i] {\n                third = top;\n                stack.pop();\n                has_third = true;\n            } else {\n                break;\n            }\n        }\n        stack.push(nums[i]);\n    }\n    false\n}`,
              php: `function find132pattern($nums) {\n    $stack = array();\n    $hasThird = false;\n    $third = 0;\n    for ($i = count($nums) - 1; $i >= 0; $i--) {\n        if ($hasThird && $nums[$i] < $third) return true;\n        while (count($stack) > 0 && $stack[count($stack) - 1] < $nums[$i]) {\n            $third = array_pop($stack);\n            $hasThird = true;\n        }\n        $stack[] = $nums[$i];\n    }\n    return false;\n}`,
              ruby: `def find132pattern(nums)\n  stack = []\n  has_third = false\n  third = 0\n  (nums.length - 1).downto(0) do |i|\n    return true if has_third && nums[i] < third\n    while !stack.empty? && stack[-1] < nums[i]\n      third = stack.pop\n      has_third = true\n    end\n    stack.push(nums[i])\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Maximum Width Ramp ──────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const stack: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        if (stack.length === 0 || nums[stack[stack.length - 1]] > nums[i]) stack.push(i);
      }
      let best = 0;
      for (let j = nums.length - 1; j >= 0; j--) {
        while (stack.length > 0 && nums[stack[stack.length - 1]] <= nums[j]) {
          const i = stack.pop() as number;
          if (j - i > best) best = j - i;
        }
      }
      return best;
    };
    return {
      slug: "maximum-width-ramp",
      title: "Maximum Width Ramp",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Two Pointers", "Google", "Amazon"],
      signature: { funcName: "maxWidthRamp", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **ramp** in an integer array `nums` is a pair `(i, j)` with `i < j` and `nums[i] <= nums[j]`; its width is `j - i`.\n\nReturn the maximum width of any ramp, or `0` if none exists.",
        [
          { in: "nums = [6,0,8,2,1,5]", out: "4", note: "The ramp (1, 5) has nums[1] = 0 <= nums[5] = 5." },
          { in: "nums = [9,8,1,0,1,9,4,0,4,1]", out: "7" },
          { in: "nums = [5,4,3]", out: "0" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 50000"]),
      hints: [
        "Only a **strictly decreasing** prefix can supply the left end of the widest ramp — any later, larger value would be a worse start.",
        "Build that stack of candidate left indices in one forward pass.",
        "Then scan from the right, popping every candidate the current value can reach; each pop gives a ramp, and later pops can only be narrower.",
      ],
      examples: [
        { input: "[6,0,8,2,1,5]", expectedOutput: "4" },
        { input: "[9,8,1,0,1,9,4,0,4,1]", expectedOutput: "7" },
        { input: "[5,4,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 12 : 50000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maxWidthRamp(nums) -> int:\n    stack = []\n    for i, x in enumerate(nums):\n        if not stack or nums[stack[-1]] > x:\n            stack.append(i)\n    best = 0\n    for j in range(len(nums) - 1, -1, -1):\n        while stack and nums[stack[-1]] <= nums[j]:\n            i = stack.pop()\n            best = max(best, j - i)\n    return best`,
        javascript: `var maxWidthRamp = function(nums) {\n    const stack = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (stack.length === 0 || nums[stack[stack.length - 1]] > nums[i]) stack.push(i);\n    }\n    let best = 0;\n    for (let j = nums.length - 1; j >= 0; j--) {\n        while (stack.length > 0 && nums[stack[stack.length - 1]] <= nums[j]) {\n            const i = stack.pop();\n            if (j - i > best) best = j - i;\n        }\n    }\n    return best;\n};`,
              typescript: `function maxWidthRamp(nums: number[]): number {\n    var stack: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        if (stack.length === 0 || nums[stack[stack.length - 1]] > nums[i]) stack.push(i);\n    }\n    var best = 0;\n    for (var j = nums.length - 1; j >= 0; j--) {\n        while (stack.length > 0 && nums[stack[stack.length - 1]] <= nums[j]) {\n            var k = stack.pop() as number;\n            if (j - k > best) best = j - k;\n        }\n    }\n    return best;\n}`,
              java: `public static int maxWidthRamp(int[] nums) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < nums.length; i++) {\n        if (stack.isEmpty() || nums[stack.peek()] > nums[i]) stack.push(i);\n    }\n    int best = 0;\n    for (int j = nums.length - 1; j >= 0; j--) {\n        while (!stack.isEmpty() && nums[stack.peek()] <= nums[j]) {\n            int i = stack.pop();\n            best = Math.max(best, j - i);\n        }\n    }\n    return best;\n}`,
              cpp: `int maxWidthRamp(vector<int>& nums) {\n    vector<int> stack;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (stack.empty() || nums[stack.back()] > nums[i]) stack.push_back(i);\n    }\n    int best = 0;\n    for (int j = (int) nums.size() - 1; j >= 0; j--) {\n        while (!stack.empty() && nums[stack.back()] <= nums[j]) {\n            int i = stack.back();\n            stack.pop_back();\n            best = max(best, j - i);\n        }\n    }\n    return best;\n}`,
              c: `int maxWidthRamp(int* nums, int numsSize) {\n    int* stack = (int*) malloc((size_t) (numsSize > 0 ? numsSize : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (top == 0 || nums[stack[top - 1]] > nums[i]) stack[top++] = i;\n    }\n    int best = 0;\n    for (int j = numsSize - 1; j >= 0; j--) {\n        while (top > 0 && nums[stack[top - 1]] <= nums[j]) {\n            int i = stack[--top];\n            if (j - i > best) best = j - i;\n        }\n    }\n    free(stack);\n    return best;\n}`,
              csharp: `public static int MaxWidthRamp(int[] nums)\n{\n    var stack = new List<int>();\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (stack.Count == 0 || nums[stack[stack.Count - 1]] > nums[i]) stack.Add(i);\n    }\n    int best = 0;\n    for (int j = nums.Length - 1; j >= 0; j--)\n    {\n        while (stack.Count > 0 && nums[stack[stack.Count - 1]] <= nums[j])\n        {\n            int i = stack[stack.Count - 1];\n            stack.RemoveAt(stack.Count - 1);\n            best = Math.Max(best, j - i);\n        }\n    }\n    return best;\n}`,
              go: `func maxWidthRamp(nums []int) int {\n	stack := []int{}\n	for i := 0; i < len(nums); i++ {\n		if len(stack) == 0 || nums[stack[len(stack)-1]] > nums[i] {\n			stack = append(stack, i)\n		}\n	}\n	best := 0\n	for j := len(nums) - 1; j >= 0; j-- {\n		for len(stack) > 0 && nums[stack[len(stack)-1]] <= nums[j] {\n			i := stack[len(stack)-1]\n			stack = stack[:len(stack)-1]\n			if j-i > best {\n				best = j - i\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxWidthRamp(nums: IntArray): Int {\n    val stack = ArrayList<Int>()\n    for (i in nums.indices) {\n        if (stack.isEmpty() || nums[stack[stack.size - 1]] > nums[i]) stack.add(i)\n    }\n    var best = 0\n    for (j in nums.size - 1 downTo 0) {\n        while (stack.isNotEmpty() && nums[stack[stack.size - 1]] <= nums[j]) {\n            val i = stack.removeAt(stack.size - 1)\n            if (j - i > best) best = j - i\n        }\n    }\n    return best\n}`,
              swift: `func maxWidthRamp(_ nums: [Int]) -> Int {\n    var stack: [Int] = []\n    for i in 0..<nums.count {\n        if stack.isEmpty || nums[stack[stack.count - 1]] > nums[i] { stack.append(i) }\n    }\n    var best = 0\n    var j = nums.count - 1\n    while j >= 0 {\n        while let top = stack.last, nums[top] <= nums[j] {\n            stack.removeLast()\n            if j - top > best { best = j - top }\n        }\n        j -= 1\n    }\n    return best\n}`,
              rust: `fn maxWidthRamp(nums: Vec<i32>) -> i32 {\n    let mut stack: Vec<usize> = Vec::new();\n    for i in 0..nums.len() {\n        if stack.is_empty() || nums[stack[stack.len() - 1]] > nums[i] {\n            stack.push(i);\n        }\n    }\n    let mut best = 0i32;\n    for j in (0..nums.len()).rev() {\n        while let Some(&top) = stack.last() {\n            if nums[top] <= nums[j] {\n                stack.pop();\n                let width = (j - top) as i32;\n                if width > best {\n                    best = width;\n                }\n            } else {\n                break;\n            }\n        }\n    }\n    best\n}`,
              php: `function maxWidthRamp($nums) {\n    $stack = array();\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        if (count($stack) === 0 || $nums[$stack[count($stack) - 1]] > $nums[$i]) $stack[] = $i;\n    }\n    $best = 0;\n    for ($j = $n - 1; $j >= 0; $j--) {\n        while (count($stack) > 0 && $nums[$stack[count($stack) - 1]] <= $nums[$j]) {\n            $i = array_pop($stack);\n            if ($j - $i > $best) $best = $j - $i;\n        }\n    }\n    return $best;\n}`,
              ruby: `def maxWidthRamp(nums)\n  stack = []\n  nums.each_with_index do |x, i|\n    stack.push(i) if stack.empty? || nums[stack[-1]] > x\n  end\n  best = 0\n  (nums.length - 1).downto(0) do |j|\n    while !stack.empty? && nums[stack[-1]] <= nums[j]\n      i = stack.pop\n      best = j - i if j - i > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Next Greater Element III ────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const digits = String(n).split("").map(Number);
      let i = digits.length - 2;
      while (i >= 0 && digits[i] >= digits[i + 1]) i--;
      if (i < 0) return -1;
      let j = digits.length - 1;
      while (digits[j] <= digits[i]) j--;
      const t = digits[i];
      digits[i] = digits[j];
      digits[j] = t;
      const tail = digits.slice(i + 1).reverse();
      const out = digits.slice(0, i + 1).concat(tail);
      let value = 0;
      for (let k = 0; k < out.length; k++) {
        value = value * 10 + out[k];
        if (value > 2147483647) return -1;
      }
      return value;
    };
    return {
      slug: "next-greater-element-iii",
      title: "Next Greater Element III",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Two Pointers", "String", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "nextGreaterElement", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `n`, find the smallest integer that uses **exactly the same digits** and is greater than `n`.\n\nIf no such integer exists, or it does not fit in a signed 32-bit integer, return `-1`.",
        [
          { in: "n = 12", out: "21" },
          { in: "n = 21", out: "-1" },
          { in: "n = 230241", out: "230412" },
        ],
        ["1 <= n <= 2147483647"]),
      hints: [
        "This is the \"next permutation\" algorithm applied to the digit string.",
        "Scan from the right for the first digit smaller than its successor — that is the pivot.",
        "Swap it with the smallest digit to its right that still exceeds it, then reverse everything after the pivot; finally check the 32-bit bound.",
      ],
      examples: [
        { input: "12", expectedOutput: "21" },
        { input: "21", expectedOutput: "-1" },
        { input: "230241", expectedOutput: "230412" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const n = roll < 0.25 ? ri(rng, 1, 99) : roll < 0.6 ? ri(rng, 1, 1000000) : ri(rng, 1, 2147483647);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def nextGreaterElement(n: int) -> int:\n    digits = [int(c) for c in str(n)]\n    i = len(digits) - 2\n    while i >= 0 and digits[i] >= digits[i + 1]:\n        i -= 1\n    if i < 0:\n        return -1\n    j = len(digits) - 1\n    while digits[j] <= digits[i]:\n        j -= 1\n    digits[i], digits[j] = digits[j], digits[i]\n    digits[i + 1:] = reversed(digits[i + 1:])\n    value = 0\n    for d in digits:\n        value = value * 10 + d\n        if value > 2147483647:\n            return -1\n    return value`,
        javascript: `var nextGreaterElement = function(n) {\n    const digits = String(n).split("").map(Number);\n    let i = digits.length - 2;\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--;\n    if (i < 0) return -1;\n    let j = digits.length - 1;\n    while (digits[j] <= digits[i]) j--;\n    const t = digits[i];\n    digits[i] = digits[j];\n    digits[j] = t;\n    const tail = digits.slice(i + 1).reverse();\n    const out = digits.slice(0, i + 1).concat(tail);\n    let value = 0;\n    for (let k = 0; k < out.length; k++) {\n        value = value * 10 + out[k];\n        if (value > 2147483647) return -1;\n    }\n    return value;\n};`,
              typescript: `function nextGreaterElement(n: number): number {\n    var digits = String(n).split("").map(Number);\n    var i = digits.length - 2;\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--;\n    if (i < 0) return -1;\n    var j = digits.length - 1;\n    while (digits[j] <= digits[i]) j--;\n    var t = digits[i];\n    digits[i] = digits[j];\n    digits[j] = t;\n    var lo = i + 1;\n    var hi = digits.length - 1;\n    while (lo < hi) {\n        var u = digits[lo];\n        digits[lo] = digits[hi];\n        digits[hi] = u;\n        lo++;\n        hi--;\n    }\n    var value = 0;\n    for (var k = 0; k < digits.length; k++) {\n        value = value * 10 + digits[k];\n        if (value > 2147483647) return -1;\n    }\n    return value;\n}`,
              java: `public static int nextGreaterElement(int n) {\n    char[] digits = String.valueOf(n).toCharArray();\n    int i = digits.length - 2;\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--;\n    if (i < 0) return -1;\n    int j = digits.length - 1;\n    while (digits[j] <= digits[i]) j--;\n    char t = digits[i];\n    digits[i] = digits[j];\n    digits[j] = t;\n    int lo = i + 1, hi = digits.length - 1;\n    while (lo < hi) {\n        char u = digits[lo];\n        digits[lo] = digits[hi];\n        digits[hi] = u;\n        lo++;\n        hi--;\n    }\n    long value = 0;\n    for (char c : digits) {\n        value = value * 10 + (c - '0');\n        if (value > 2147483647L) return -1;\n    }\n    return (int) value;\n}`,
              cpp: `int nextGreaterElement(int n) {\n    string digits = to_string(n);\n    int i = (int) digits.size() - 2;\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--;\n    if (i < 0) return -1;\n    int j = (int) digits.size() - 1;\n    while (digits[j] <= digits[i]) j--;\n    swap(digits[i], digits[j]);\n    reverse(digits.begin() + i + 1, digits.end());\n    long long value = 0;\n    for (char c : digits) {\n        value = value * 10 + (c - '0');\n        if (value > 2147483647LL) return -1;\n    }\n    return (int) value;\n}`,
              c: `int nextGreaterElement(int n) {\n    char digits[16];\n    sprintf(digits, "%d", n);\n    int len = (int) strlen(digits);\n    int i = len - 2;\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--;\n    if (i < 0) return -1;\n    int j = len - 1;\n    while (digits[j] <= digits[i]) j--;\n    char t = digits[i];\n    digits[i] = digits[j];\n    digits[j] = t;\n    int lo = i + 1, hi = len - 1;\n    while (lo < hi) {\n        char u = digits[lo];\n        digits[lo] = digits[hi];\n        digits[hi] = u;\n        lo++;\n        hi--;\n    }\n    long long value = 0;\n    for (int k = 0; k < len; k++) {\n        value = value * 10 + (digits[k] - '0');\n        if (value > 2147483647LL) return -1;\n    }\n    return (int) value;\n}`,
              csharp: `public static int NextGreaterElement(int n)\n{\n    char[] digits = n.ToString().ToCharArray();\n    int i = digits.Length - 2;\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--;\n    if (i < 0) return -1;\n    int j = digits.Length - 1;\n    while (digits[j] <= digits[i]) j--;\n    char t = digits[i];\n    digits[i] = digits[j];\n    digits[j] = t;\n    int lo = i + 1, hi = digits.Length - 1;\n    while (lo < hi)\n    {\n        char u = digits[lo];\n        digits[lo] = digits[hi];\n        digits[hi] = u;\n        lo++;\n        hi--;\n    }\n    long value = 0;\n    foreach (char c in digits)\n    {\n        value = value * 10 + (c - '0');\n        if (value > 2147483647L) return -1;\n    }\n    return (int) value;\n}`,
              go: `func nextGreaterElement(n int) int {\n	digits := []byte(strconv.Itoa(n))\n	i := len(digits) - 2\n	for i >= 0 && digits[i] >= digits[i+1] {\n		i--\n	}\n	if i < 0 {\n		return -1\n	}\n	j := len(digits) - 1\n	for digits[j] <= digits[i] {\n		j--\n	}\n	digits[i], digits[j] = digits[j], digits[i]\n	lo, hi := i+1, len(digits)-1\n	for lo < hi {\n		digits[lo], digits[hi] = digits[hi], digits[lo]\n		lo++\n		hi--\n	}\n	value := 0\n	for _, c := range digits {\n		value = value*10 + int(c-'0')\n		if value > 2147483647 {\n			return -1\n		}\n	}\n	return value\n}`,
              kotlin: `fun nextGreaterElement(n: Int): Int {\n    val digits = n.toString().toCharArray()\n    var i = digits.size - 2\n    while (i >= 0 && digits[i] >= digits[i + 1]) i--\n    if (i < 0) return -1\n    var j = digits.size - 1\n    while (digits[j] <= digits[i]) j--\n    val t = digits[i]\n    digits[i] = digits[j]\n    digits[j] = t\n    var lo = i + 1\n    var hi = digits.size - 1\n    while (lo < hi) {\n        val u = digits[lo]\n        digits[lo] = digits[hi]\n        digits[hi] = u\n        lo++\n        hi--\n    }\n    var value = 0L\n    for (c in digits) {\n        value = value * 10 + (c - '0')\n        if (value > 2147483647L) return -1\n    }\n    return value.toInt()\n}`,
              swift: `func nextGreaterElement(_ n: Int) -> Int {\n    var digits = Array(String(n).unicodeScalars).map { Int($0.value) - 48 }\n    var i = digits.count - 2\n    while i >= 0 && digits[i] >= digits[i + 1] { i -= 1 }\n    if i < 0 { return -1 }\n    var j = digits.count - 1\n    while digits[j] <= digits[i] { j -= 1 }\n    digits.swapAt(i, j)\n    var lo = i + 1\n    var hi = digits.count - 1\n    while lo < hi {\n        digits.swapAt(lo, hi)\n        lo += 1\n        hi -= 1\n    }\n    var value = 0\n    for d in digits {\n        value = value * 10 + d\n        if value > 2147483647 { return -1 }\n    }\n    return value\n}`,
              rust: `fn nextGreaterElement(n: i32) -> i32 {\n    let mut digits: Vec<i64> = n.to_string().bytes().map(|b| (b - b'0') as i64).collect();\n    if digits.len() < 2 {\n        return -1;\n    }\n    let mut i = digits.len() - 1;\n    let mut found = false;\n    while i > 0 {\n        if digits[i - 1] < digits[i] {\n            found = true;\n            break;\n        }\n        i -= 1;\n    }\n    if !found {\n        return -1;\n    }\n    let pivot = i - 1;\n    let mut j = digits.len() - 1;\n    while digits[j] <= digits[pivot] {\n        j -= 1;\n    }\n    digits.swap(pivot, j);\n    digits[pivot + 1..].reverse();\n    let mut value: i64 = 0;\n    for d in digits.iter() {\n        value = value * 10 + *d;\n        if value > 2147483647 {\n            return -1;\n        }\n    }\n    value as i32\n}`,
              php: `function nextGreaterElement($n) {\n    $digits = str_split((string) $n);\n    $len = count($digits);\n    $i = $len - 2;\n    while ($i >= 0 && $digits[$i] >= $digits[$i + 1]) $i--;\n    if ($i < 0) return -1;\n    $j = $len - 1;\n    while ($digits[$j] <= $digits[$i]) $j--;\n    $t = $digits[$i];\n    $digits[$i] = $digits[$j];\n    $digits[$j] = $t;\n    $tail = array_reverse(array_slice($digits, $i + 1));\n    $digits = array_merge(array_slice($digits, 0, $i + 1), $tail);\n    $value = 0;\n    foreach ($digits as $d) {\n        $value = $value * 10 + intval($d);\n        if ($value > 2147483647) return -1;\n    }\n    return $value;\n}`,
              ruby: `def nextGreaterElement(n)\n  digits = n.to_s.chars.map(&:to_i)\n  i = digits.length - 2\n  i -= 1 while i >= 0 && digits[i] >= digits[i + 1]\n  return -1 if i < 0\n  j = digits.length - 1\n  j -= 1 while digits[j] <= digits[i]\n  digits[i], digits[j] = digits[j], digits[i]\n  digits = digits[0..i] + digits[(i + 1)..-1].reverse\n  value = 0\n  digits.each do |d|\n    value = value * 10 + d\n    return -1 if value > 2147483647\n  end\n  value\nend`,
      },
    };
  })(),

  // ── Validate Stack Sequences ────────────────────────────────────
  (() => {
    const ref = (pushed: number[], popped: number[]) => {
      const stack: number[] = [];
      let j = 0;
      for (let i = 0; i < pushed.length; i++) {
        stack.push(pushed[i]);
        while (stack.length > 0 && j < popped.length && stack[stack.length - 1] === popped[j]) {
          stack.pop();
          j++;
        }
      }
      return stack.length === 0;
    };
    return {
      slug: "validate-stack-sequences",
      title: "Validate Stack Sequences",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Simulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "validateStackSequences", params: [{ name: "pushed", type: "int[]" as const }, { name: "popped", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given two integer arrays `pushed` and `popped`, each a permutation of the other with **distinct** values, return `true` if they could be the push and pop sequences of one initially empty stack.",
        [
          { in: "pushed = [1,2,3,4,5], popped = [4,5,3,2,1]", out: "true" },
          { in: "pushed = [1,2,3,4,5], popped = [4,3,5,1,2]", out: "false", note: "1 cannot be popped before 2." },
          { in: "pushed = [1], popped = [1]", out: "true" },
        ],
        ["1 <= pushed.length <= 30", "popped.length == pushed.length", "The two arrays are permutations of each other with distinct values."]),
      hints: [
        "Simulate: push the values in order, and after each push, pop greedily while the top matches the next value to pop.",
        "The greedy pop is forced — if the top equals the next expected pop and you do not pop it now, you never can.",
        "The sequences are valid exactly when the stack ends empty.",
      ],
      examples: [
        { input: "[1,2,3,4,5]\n[4,5,3,2,1]", expectedOutput: "true" },
        { input: "[1,2,3,4,5]\n[4,3,5,1,2]", expectedOutput: "false" },
        { input: "[1]\n[1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const pushed = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        let popped: number[];
        if (rng() < 0.5) {
          // Build a genuinely reachable pop order by simulating random pops.
          popped = [];
          const stack: number[] = [];
          let i = 0;
          while (popped.length < n) {
            if (stack.length === 0 || (i < n && rng() < 0.5)) stack.push(pushed[i++]);
            else popped.push(stack.pop() as number);
          }
        } else {
          popped = shuffle(rng, pushed.slice());
        }
        return { input: `${fmtIntArr(pushed)}\n${fmtIntArr(popped)}`, expectedOutput: bool(ref(pushed, popped)) };
      },
      solutions: {
        python: `def validateStackSequences(pushed, popped) -> bool:\n    stack = []\n    j = 0\n    for x in pushed:\n        stack.append(x)\n        while stack and j < len(popped) and stack[-1] == popped[j]:\n            stack.pop()\n            j += 1\n    return len(stack) == 0`,
        javascript: `var validateStackSequences = function(pushed, popped) {\n    const stack = [];\n    let j = 0;\n    for (let i = 0; i < pushed.length; i++) {\n        stack.push(pushed[i]);\n        while (stack.length > 0 && j < popped.length && stack[stack.length - 1] === popped[j]) {\n            stack.pop();\n            j++;\n        }\n    }\n    return stack.length === 0;\n};`,
              typescript: `function validateStackSequences(pushed: number[], popped: number[]): boolean {\n    var stack: number[] = [];\n    var j = 0;\n    for (var i = 0; i < pushed.length; i++) {\n        stack.push(pushed[i]);\n        while (stack.length > 0 && j < popped.length && stack[stack.length - 1] === popped[j]) {\n            stack.pop();\n            j++;\n        }\n    }\n    return stack.length === 0;\n}`,
              java: `public static boolean validateStackSequences(int[] pushed, int[] popped) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    int j = 0;\n    for (int x : pushed) {\n        stack.push(x);\n        while (!stack.isEmpty() && j < popped.length && stack.peek() == popped[j]) {\n            stack.pop();\n            j++;\n        }\n    }\n    return stack.isEmpty();\n}`,
              cpp: `bool validateStackSequences(vector<int>& pushed, vector<int>& popped) {\n    vector<int> stack;\n    int j = 0;\n    for (int x : pushed) {\n        stack.push_back(x);\n        while (!stack.empty() && j < (int) popped.size() && stack.back() == popped[j]) {\n            stack.pop_back();\n            j++;\n        }\n    }\n    return stack.empty();\n}`,
              c: `bool validateStackSequences(int* pushed, int pushedSize, int* popped, int poppedSize) {\n    int* stack = (int*) malloc((size_t) (pushedSize > 0 ? pushedSize : 1) * sizeof(int));\n    int top = 0, j = 0;\n    for (int i = 0; i < pushedSize; i++) {\n        stack[top++] = pushed[i];\n        while (top > 0 && j < poppedSize && stack[top - 1] == popped[j]) {\n            top--;\n            j++;\n        }\n    }\n    bool ok = (top == 0);\n    free(stack);\n    return ok;\n}`,
              csharp: `public static bool ValidateStackSequences(int[] pushed, int[] popped)\n{\n    var stack = new List<int>();\n    int j = 0;\n    foreach (int x in pushed)\n    {\n        stack.Add(x);\n        while (stack.Count > 0 && j < popped.Length && stack[stack.Count - 1] == popped[j])\n        {\n            stack.RemoveAt(stack.Count - 1);\n            j++;\n        }\n    }\n    return stack.Count == 0;\n}`,
              go: `func validateStackSequences(pushed []int, popped []int) bool {\n	stack := []int{}\n	j := 0\n	for _, x := range pushed {\n		stack = append(stack, x)\n		for len(stack) > 0 && j < len(popped) && stack[len(stack)-1] == popped[j] {\n			stack = stack[:len(stack)-1]\n			j++\n		}\n	}\n	return len(stack) == 0\n}`,
              kotlin: `fun validateStackSequences(pushed: IntArray, popped: IntArray): Boolean {\n    val stack = ArrayList<Int>()\n    var j = 0\n    for (x in pushed) {\n        stack.add(x)\n        while (stack.isNotEmpty() && j < popped.size && stack[stack.size - 1] == popped[j]) {\n            stack.removeAt(stack.size - 1)\n            j++\n        }\n    }\n    return stack.isEmpty()\n}`,
              swift: `func validateStackSequences(_ pushed: [Int], _ popped: [Int]) -> Bool {\n    var stack: [Int] = []\n    var j = 0\n    for x in pushed {\n        stack.append(x)\n        while let top = stack.last, j < popped.count, top == popped[j] {\n            stack.removeLast()\n            j += 1\n        }\n    }\n    return stack.isEmpty\n}`,
              rust: `fn validateStackSequences(pushed: Vec<i32>, popped: Vec<i32>) -> bool {\n    let mut stack: Vec<i32> = Vec::new();\n    let mut j = 0usize;\n    for x in pushed.iter() {\n        stack.push(*x);\n        while !stack.is_empty() && j < popped.len() && stack[stack.len() - 1] == popped[j] {\n            stack.pop();\n            j += 1;\n        }\n    }\n    stack.is_empty()\n}`,
              php: `function validateStackSequences($pushed, $popped) {\n    $stack = array();\n    $j = 0;\n    foreach ($pushed as $x) {\n        $stack[] = $x;\n        while (count($stack) > 0 && $j < count($popped) && $stack[count($stack) - 1] === $popped[$j]) {\n            array_pop($stack);\n            $j++;\n        }\n    }\n    return count($stack) === 0;\n}`,
              ruby: `def validateStackSequences(pushed, popped)\n  stack = []\n  j = 0\n  pushed.each do |x|\n    stack.push(x)\n    while !stack.empty? && j < popped.length && stack[-1] == popped[j]\n      stack.pop\n      j += 1\n    end\n  end\n  stack.empty?\nend`,
      },
    };
  })(),

  // ── Longest Valid Parentheses ───────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const stack: number[] = [-1];
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") stack.push(i);
        else {
          stack.pop();
          if (stack.length === 0) stack.push(i);
          else {
            const len = i - stack[stack.length - 1];
            if (len > best) best = len;
          }
        }
      }
      return best;
    };
    return {
      slug: "longest-valid-parentheses",
      title: "Longest Valid Parentheses",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Stack", "Amazon", "Google", "Meta", "Microsoft"],
      signature: { funcName: "longestValidParentheses", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` of `'('` and `')'`, return the length of the longest **valid** (well-formed and contiguous) parentheses substring.",
        [
          { in: 's = "(()"', out: "2", note: 'The longest valid substring is "()".' },
          { in: 's = ")()())"', out: "4" },
          { in: 's = ""', out: "0" },
        ],
        ["0 <= s.length <= 40", "s consists of '(' and ')'."]),
      hints: [
        "Keep a stack of indices, seeded with `-1` to mark the base of the current valid run.",
        "Push the index of every `(`; on a `)`, pop.",
        "If the stack empties, this `)` is unmatched — push its index as the new base; otherwise the run length is the current index minus the new top.",
      ],
      examples: [
        { input: '"(()"', expectedOutput: "2" },
        { input: '")()())"', expectedOutput: "4" },
        { input: '""', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = rng() < 0.3 ? randBalanced(rng, ri(rng, 0, 20)) : randStr(rng, 0, 40, "()");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def longestValidParentheses(s: str) -> int:\n    stack = [-1]\n    best = 0\n    for i, ch in enumerate(s):\n        if ch == "(":\n            stack.append(i)\n        else:\n            stack.pop()\n            if not stack:\n                stack.append(i)\n            else:\n                best = max(best, i - stack[-1])\n    return best`,
        javascript: `var longestValidParentheses = function(s) {\n    const stack = [-1];\n    let best = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            stack.push(i);\n        } else {\n            stack.pop();\n            if (stack.length === 0) {\n                stack.push(i);\n            } else {\n                const len = i - stack[stack.length - 1];\n                if (len > best) best = len;\n            }\n        }\n    }\n    return best;\n};`,
              typescript: `function longestValidParentheses(s: string): number {\n    var stack: number[] = [-1];\n    var best = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            stack.push(i);\n        } else {\n            stack.pop();\n            if (stack.length === 0) {\n                stack.push(i);\n            } else {\n                var len = i - stack[stack.length - 1];\n                if (len > best) best = len;\n            }\n        }\n    }\n    return best;\n}`,
              java: `public static int longestValidParentheses(String s) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(-1);\n    int best = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '(') {\n            stack.push(i);\n        } else {\n            stack.pop();\n            if (stack.isEmpty()) {\n                stack.push(i);\n            } else {\n                best = Math.max(best, i - stack.peek());\n            }\n        }\n    }\n    return best;\n}`,
              cpp: `int longestValidParentheses(string s) {\n    vector<int> stack;\n    stack.push_back(-1);\n    int best = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] == '(') {\n            stack.push_back(i);\n        } else {\n            stack.pop_back();\n            if (stack.empty()) {\n                stack.push_back(i);\n            } else {\n                best = max(best, i - stack.back());\n            }\n        }\n    }\n    return best;\n}`,
              c: `int longestValidParentheses(const char* s) {\n    int n = (int) strlen(s);\n    int* stack = (int*) malloc((size_t) (n + 2) * sizeof(int));\n    int top = 0;\n    stack[top++] = -1;\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '(') {\n            stack[top++] = i;\n        } else {\n            top--;\n            if (top == 0) {\n                stack[top++] = i;\n            } else {\n                int len = i - stack[top - 1];\n                if (len > best) best = len;\n            }\n        }\n    }\n    free(stack);\n    return best;\n}`,
              csharp: `public static int LongestValidParentheses(string s)\n{\n    var stack = new List<int>();\n    stack.Add(-1);\n    int best = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == '(')\n        {\n            stack.Add(i);\n        }\n        else\n        {\n            stack.RemoveAt(stack.Count - 1);\n            if (stack.Count == 0)\n            {\n                stack.Add(i);\n            }\n            else\n            {\n                best = Math.Max(best, i - stack[stack.Count - 1]);\n            }\n        }\n    }\n    return best;\n}`,
              go: `func longestValidParentheses(s string) int {\n	stack := []int{-1}\n	best := 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			stack = append(stack, i)\n		} else {\n			stack = stack[:len(stack)-1]\n			if len(stack) == 0 {\n				stack = append(stack, i)\n			} else if i-stack[len(stack)-1] > best {\n				best = i - stack[len(stack)-1]\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun longestValidParentheses(s: String): Int {\n    val stack = ArrayList<Int>()\n    stack.add(-1)\n    var best = 0\n    for (i in s.indices) {\n        if (s[i] == '(') {\n            stack.add(i)\n        } else {\n            stack.removeAt(stack.size - 1)\n            if (stack.isEmpty()) {\n                stack.add(i)\n            } else {\n                val len = i - stack[stack.size - 1]\n                if (len > best) best = len\n            }\n        }\n    }\n    return best\n}`,
              swift: `func longestValidParentheses(_ s: String) -> Int {\n    var stack: [Int] = [-1]\n    var best = 0\n    let chars = Array(s)\n    for i in 0..<chars.count {\n        if chars[i] == "(" {\n            stack.append(i)\n        } else {\n            stack.removeLast()\n            if stack.isEmpty {\n                stack.append(i)\n            } else {\n                let len = i - stack[stack.count - 1]\n                if len > best { best = len }\n            }\n        }\n    }\n    return best\n}`,
              rust: `fn longestValidParentheses(s: String) -> i32 {\n    let mut stack: Vec<i32> = vec![-1];\n    let mut best = 0i32;\n    let chars: Vec<u8> = s.bytes().collect();\n    for i in 0..chars.len() {\n        if chars[i] == b'(' {\n            stack.push(i as i32);\n        } else {\n            stack.pop();\n            if stack.is_empty() {\n                stack.push(i as i32);\n            } else {\n                let len = i as i32 - stack[stack.len() - 1];\n                if len > best {\n                    best = len;\n                }\n            }\n        }\n    }\n    best\n}`,
              php: `function longestValidParentheses($s) {\n    $stack = array(-1);\n    $best = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "(") {\n            $stack[] = $i;\n        } else {\n            array_pop($stack);\n            if (count($stack) === 0) {\n                $stack[] = $i;\n            } else {\n                $len = $i - $stack[count($stack) - 1];\n                if ($len > $best) $best = $len;\n            }\n        }\n    }\n    return $best;\n}`,
              ruby: `def longestValidParentheses(s)\n  stack = [-1]\n  best = 0\n  s.each_char.with_index do |c, i|\n    if c == "("\n      stack.push(i)\n    else\n      stack.pop\n      if stack.empty?\n        stack.push(i)\n      else\n        len = i - stack[-1]\n        best = len if len > best\n      end\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Basic Calculator II ─────────────────────────────────────────
  (() => {
    const trunc = (a: number, b: number) => {
      const q = a / b;
      return q < 0 ? Math.ceil(q) : Math.floor(q);
    };
    const ref = (s: string) => {
      const stack: number[] = [];
      let num = 0;
      let sign = "+";
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c >= "0" && c <= "9") num = num * 10 + (c.charCodeAt(0) - 48);
        if ((c !== " " && (c < "0" || c > "9")) || i === s.length - 1) {
          if (sign === "+") stack.push(num);
          else if (sign === "-") stack.push(-num);
          else if (sign === "*") stack.push((stack.pop() as number) * num);
          else stack.push(trunc(stack.pop() as number, num));
          sign = c;
          num = 0;
        }
      }
      let total = 0;
      for (let i = 0; i < stack.length; i++) total += stack[i];
      return total;
    };
    return {
      slug: "basic-calculator-ii",
      title: "Basic Calculator II",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Stack", "Amazon", "Google", "Microsoft", "Meta"],
      signature: { funcName: "calculate", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` holding a valid arithmetic expression, evaluate it and return the result.\n\nThe expression contains non-negative integers, the operators `+ - * /`, and spaces. There are no parentheses. Integer division **truncates toward zero**.",
        [
          { in: 's = "3+2*2"', out: "7" },
          { in: 's = " 3/2 "', out: "1" },
          { in: 's = " 3+5 / 2 "', out: "5" },
        ],
        ["1 <= s.length <= 64", "s consists of digits, '+', '-', '*', '/' and ' '.", "Every operand is a non-negative integer below 100.", "Division by zero never occurs.", "Every intermediate value and the answer fit in a signed 32-bit integer."]),
      hints: [
        "Push each term onto a stack, negating it after a `-`; the final answer is the sum of the stack.",
        "`*` and `/` bind tighter, so apply them immediately to the value on top of the stack.",
        "Careful with `/`: the top of the stack may be negative, and the truncation must go toward zero, not downward.",
      ],
      examples: [
        { input: '"3+2*2"', expectedOutput: "7" },
        { input: '" 3/2 "', expectedOutput: "1" },
        { input: '" 3+5 / 2 "', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        // Build the expression as additive terms of at most three factors each.
        // A longer '*' chain would push an intermediate past a signed 32-bit
        // integer, which the problem statement rules out.
        const tokens: string[] = [];
        const termCount = ri(rng, 1, 4);
        for (let t = 0; t < termCount; t++) {
          if (t > 0) tokens.push(rng() < 0.5 ? "+" : "-");
          const factors = ri(rng, 1, 3);
          tokens.push(String(ri(rng, 0, 99)));
          for (let f = 1; f < factors; f++) {
            // A zero operand after '/' would be a division by zero, which the
            // problem statement rules out.
            const op = rng() < 0.5 ? "*" : "/";
            tokens.push(op);
            tokens.push(String(op === "/" ? ri(rng, 1, 99) : ri(rng, 0, 99)));
          }
        }
        let s = "";
        for (let i = 0; i < tokens.length; i++) {
          s += tokens[i];
          if (i + 1 < tokens.length && rng() < 0.2) s += " ";
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def calculate(s: str) -> int:\n    stack = []\n    num = 0\n    sign = "+"\n    for i, ch in enumerate(s):\n        if ch.isdigit():\n            num = num * 10 + int(ch)\n        if (ch != " " and not ch.isdigit()) or i == len(s) - 1:\n            if sign == "+":\n                stack.append(num)\n            elif sign == "-":\n                stack.append(-num)\n            elif sign == "*":\n                stack.append(stack.pop() * num)\n            else:\n                a = stack.pop()\n                q = abs(a) // num\n                stack.append(q if a >= 0 else -q)\n            sign = ch\n            num = 0\n    return sum(stack)`,
        javascript: `var calculate = function(s) {\n    const stack = [];\n    let num = 0;\n    let sign = "+";\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        const isDigit = c >= "0" && c <= "9";\n        if (isDigit) num = num * 10 + (c.charCodeAt(0) - 48);\n        if ((c !== " " && !isDigit) || i === s.length - 1) {\n            if (sign === "+") {\n                stack.push(num);\n            } else if (sign === "-") {\n                stack.push(-num);\n            } else if (sign === "*") {\n                stack.push(stack.pop() * num);\n            } else {\n                const q = stack.pop() / num;\n                stack.push(q < 0 ? Math.ceil(q) : Math.floor(q));\n            }\n            sign = c;\n            num = 0;\n        }\n    }\n    let total = 0;\n    for (let i = 0; i < stack.length; i++) total += stack[i];\n    return total;\n};`,
              typescript: `function calculate(s: string): number {\n    var stack: number[] = [];\n    var num = 0;\n    var sign = "+";\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        var isDigit = c >= "0" && c <= "9";\n        if (isDigit) num = num * 10 + (s.charCodeAt(i) - 48);\n        if ((c !== " " && !isDigit) || i === s.length - 1) {\n            if (sign === "+") {\n                stack.push(num);\n            } else if (sign === "-") {\n                stack.push(-num);\n            } else if (sign === "*") {\n                stack.push((stack.pop() as number) * num);\n            } else {\n                var q = (stack.pop() as number) / num;\n                stack.push(q < 0 ? Math.ceil(q) : Math.floor(q));\n            }\n            sign = c;\n            num = 0;\n        }\n    }\n    var total = 0;\n    for (var j = 0; j < stack.length; j++) total += stack[j];\n    return total;\n}`,
              java: `public static int calculate(String s) {\n    List<Integer> stack = new ArrayList<>();\n    int num = 0;\n    char sign = '+';\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        boolean isDigit = c >= '0' && c <= '9';\n        if (isDigit) num = num * 10 + (c - '0');\n        if ((c != ' ' && !isDigit) || i == s.length() - 1) {\n            if (sign == '+') {\n                stack.add(num);\n            } else if (sign == '-') {\n                stack.add(-num);\n            } else if (sign == '*') {\n                stack.set(stack.size() - 1, stack.get(stack.size() - 1) * num);\n            } else {\n                stack.set(stack.size() - 1, stack.get(stack.size() - 1) / num);\n            }\n            sign = c;\n            num = 0;\n        }\n    }\n    int total = 0;\n    for (int x : stack) total += x;\n    return total;\n}`,
              cpp: `int calculate(string s) {\n    vector<int> stack;\n    int num = 0;\n    char sign = '+';\n    for (int i = 0; i < (int) s.size(); i++) {\n        char c = s[i];\n        bool isDigit = c >= '0' && c <= '9';\n        if (isDigit) num = num * 10 + (c - '0');\n        if ((c != ' ' && !isDigit) || i == (int) s.size() - 1) {\n            if (sign == '+') stack.push_back(num);\n            else if (sign == '-') stack.push_back(-num);\n            else if (sign == '*') stack.back() = stack.back() * num;\n            else stack.back() = stack.back() / num;\n            sign = c;\n            num = 0;\n        }\n    }\n    int total = 0;\n    for (int x : stack) total += x;\n    return total;\n}`,
              c: `int calculate(const char* s) {\n    int n = (int) strlen(s);\n    int* stack = (int*) malloc((size_t) (n + 2) * sizeof(int));\n    int top = 0;\n    int num = 0;\n    char sign = '+';\n    for (int i = 0; i < n; i++) {\n        char c = s[i];\n        int isDigit = (c >= '0' && c <= '9');\n        if (isDigit) num = num * 10 + (c - '0');\n        if ((c != ' ' && !isDigit) || i == n - 1) {\n            if (sign == '+') stack[top++] = num;\n            else if (sign == '-') stack[top++] = -num;\n            else if (sign == '*') stack[top - 1] = stack[top - 1] * num;\n            else stack[top - 1] = stack[top - 1] / num;\n            sign = c;\n            num = 0;\n        }\n    }\n    int total = 0;\n    for (int i = 0; i < top; i++) total += stack[i];\n    free(stack);\n    return total;\n}`,
              csharp: `public static int Calculate(string s)\n{\n    var stack = new List<int>();\n    int num = 0;\n    char sign = '+';\n    for (int i = 0; i < s.Length; i++)\n    {\n        char c = s[i];\n        bool isDigit = c >= '0' && c <= '9';\n        if (isDigit) num = num * 10 + (c - '0');\n        if ((c != ' ' && !isDigit) || i == s.Length - 1)\n        {\n            if (sign == '+') stack.Add(num);\n            else if (sign == '-') stack.Add(-num);\n            else if (sign == '*') stack[stack.Count - 1] = stack[stack.Count - 1] * num;\n            else stack[stack.Count - 1] = stack[stack.Count - 1] / num;\n            sign = c;\n            num = 0;\n        }\n    }\n    int total = 0;\n    foreach (int x in stack) total += x;\n    return total;\n}`,
              go: `func calculate(s string) int {\n	stack := []int{}\n	num := 0\n	sign := byte('+')\n	for i := 0; i < len(s); i++ {\n		c := s[i]\n		isDigit := c >= '0' && c <= '9'\n		if isDigit {\n			num = num*10 + int(c-'0')\n		}\n		if (c != ' ' && !isDigit) || i == len(s)-1 {\n			switch sign {\n			case '+':\n				stack = append(stack, num)\n			case '-':\n				stack = append(stack, -num)\n			case '*':\n				stack[len(stack)-1] = stack[len(stack)-1] * num\n			default:\n				stack[len(stack)-1] = stack[len(stack)-1] / num\n			}\n			sign = c\n			num = 0\n		}\n	}\n	total := 0\n	for _, x := range stack {\n		total += x\n	}\n	return total\n}`,
              kotlin: `fun calculate(s: String): Int {\n    val stack = ArrayList<Int>()\n    var num = 0\n    var sign = '+'\n    for (i in s.indices) {\n        val c = s[i]\n        val isDigit = c in '0'..'9'\n        if (isDigit) num = num * 10 + (c - '0')\n        if ((c != ' ' && !isDigit) || i == s.length - 1) {\n            when (sign) {\n                '+' -> stack.add(num)\n                '-' -> stack.add(-num)\n                '*' -> stack[stack.size - 1] = stack[stack.size - 1] * num\n                else -> stack[stack.size - 1] = stack[stack.size - 1] / num\n            }\n            sign = c\n            num = 0\n        }\n    }\n    var total = 0\n    for (x in stack) total += x\n    return total\n}`,
              swift: `func calculate(_ s: String) -> Int {\n    let chars = Array(s.unicodeScalars).map { Int($0.value) }\n    var stack: [Int] = []\n    var num = 0\n    var sign = 43\n    for i in 0..<chars.count {\n        let c = chars[i]\n        let isDigit = c >= 48 && c <= 57\n        if isDigit { num = num * 10 + (c - 48) }\n        if (c != 32 && !isDigit) || i == chars.count - 1 {\n            if sign == 43 {\n                stack.append(num)\n            } else if sign == 45 {\n                stack.append(-num)\n            } else if sign == 42 {\n                stack[stack.count - 1] = stack[stack.count - 1] * num\n            } else {\n                stack[stack.count - 1] = stack[stack.count - 1] / num\n            }\n            sign = c\n            num = 0\n        }\n    }\n    var total = 0\n    for x in stack { total += x }\n    return total\n}`,
              rust: `fn calculate(s: String) -> i32 {\n    let chars: Vec<u8> = s.bytes().collect();\n    let mut stack: Vec<i32> = Vec::new();\n    let mut num: i32 = 0;\n    let mut sign = b'+';\n    for i in 0..chars.len() {\n        let c = chars[i];\n        let is_digit = c >= b'0' && c <= b'9';\n        if is_digit {\n            num = num * 10 + (c - b'0') as i32;\n        }\n        if (c != b' ' && !is_digit) || i == chars.len() - 1 {\n            let n = stack.len();\n            if sign == b'+' {\n                stack.push(num);\n            } else if sign == b'-' {\n                stack.push(-num);\n            } else if sign == b'*' {\n                stack[n - 1] = stack[n - 1] * num;\n            } else {\n                stack[n - 1] = stack[n - 1] / num;\n            }\n            sign = c;\n            num = 0;\n        }\n    }\n    stack.iter().sum()\n}`,
              php: `function calculate($s) {\n    $stack = array();\n    $num = 0;\n    $sign = "+";\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        $isDigit = $c >= "0" && $c <= "9";\n        if ($isDigit) $num = $num * 10 + intval($c);\n        if (($c !== " " && !$isDigit) || $i === $n - 1) {\n            if ($sign === "+") $stack[] = $num;\n            else if ($sign === "-") $stack[] = -$num;\n            else if ($sign === "*") $stack[count($stack) - 1] = $stack[count($stack) - 1] * $num;\n            else $stack[count($stack) - 1] = intdiv($stack[count($stack) - 1], $num);\n            $sign = $c;\n            $num = 0;\n        }\n    }\n    return array_sum($stack);\n}`,
              ruby: `def calculate(s)\n  stack = []\n  num = 0\n  sign = "+"\n  n = s.length\n  (0...n).each do |i|\n    c = s[i]\n    is_digit = c >= "0" && c <= "9"\n    num = num * 10 + c.to_i if is_digit\n    if (c != " " && !is_digit) || i == n - 1\n      case sign\n      when "+" then stack.push(num)\n      when "-" then stack.push(-num)\n      when "*" then stack[-1] = stack[-1] * num\n      else\n        a = stack[-1]\n        q = a.abs / num\n        stack[-1] = a < 0 ? -q : q\n      end\n      sign = c\n      num = 0\n    end\n  end\n  stack.sum\nend`,
      },
    };
  })(),

  // ── Reverse Substrings Between Each Pair of Parentheses ─────────
  (() => {
    const ref = (s: string) => {
      const stack: string[][] = [[]];
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "(") stack.push([]);
        else if (c === ")") {
          const inner = stack.pop() as string[];
          inner.reverse();
          const top = stack[stack.length - 1];
          for (let j = 0; j < inner.length; j++) top.push(inner[j]);
        } else {
          stack[stack.length - 1].push(c);
        }
      }
      return stack[0].join("");
    };
    return {
      slug: "reverse-substrings-between-each-pair-of-parentheses",
      title: "Reverse Substrings Between Each Pair of Parentheses",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "reverseParentheses", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` of lowercase letters and balanced parentheses.\n\nReverse the substrings inside each pair of matching parentheses, starting from the innermost pair, and return the result with all brackets removed.",
        [
          { in: 's = "(abcd)"', out: "dcba" },
          { in: 's = "(u(love)i)"', out: "iloveu", note: '"love" is reversed first, then the whole thing.' },
          { in: 's = "(ed(et(oc))el)"', out: "leetcode" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters and balanced parentheses."]),
      hints: [
        "Keep a stack of character buffers, one per open bracket level.",
        "`(` starts a new buffer; `)` reverses the top buffer and appends it to the one below.",
        "Everything else is appended to the current buffer, so the innermost pairs resolve first automatically.",
      ],
      examples: [
        { input: '"(abcd)"', expectedOutput: "dcba" },
        { input: '"(u(love)i)"', expectedOutput: "iloveu" },
        { input: '"(ed(et(oc))el)"', expectedOutput: "leetcode" },
      ],
      gen: (rng: Rng) => {
        const skeleton = randBalanced(rng, ri(rng, 0, 10));
        let s = "";
        for (let i = 0; i < skeleton.length; i++) {
          s += skeleton[i];
          const letters = ri(rng, 0, 2);
          for (let j = 0; j < letters; j++) s += "abcde"[ri(rng, 0, 4)];
        }
        if (s === "") s = "a";
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def reverseParentheses(s: str) -> str:\n    stack = [[]]\n    for ch in s:\n        if ch == "(":\n            stack.append([])\n        elif ch == ")":\n            inner = stack.pop()\n            inner.reverse()\n            stack[-1].extend(inner)\n        else:\n            stack[-1].append(ch)\n    return "".join(stack[0])`,
        javascript: `var reverseParentheses = function(s) {\n    const stack = [[]];\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (c === "(") {\n            stack.push([]);\n        } else if (c === ")") {\n            const inner = stack.pop();\n            inner.reverse();\n            const top = stack[stack.length - 1];\n            for (let j = 0; j < inner.length; j++) top.push(inner[j]);\n        } else {\n            stack[stack.length - 1].push(c);\n        }\n    }\n    return stack[0].join("");\n};`,
              typescript: `function reverseParentheses(s: string): string {\n    var out: string[] = [];\n    var starts: number[] = [];\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "(") {\n            starts.push(out.length);\n        } else if (c === ")") {\n            var st = starts.pop() as number;\n            var a = st;\n            var b = out.length - 1;\n            while (a < b) {\n                var t = out[a];\n                out[a] = out[b];\n                out[b] = t;\n                a++;\n                b--;\n            }\n        } else {\n            out.push(c);\n        }\n    }\n    return out.join("");\n}`,
              java: `public static String reverseParentheses(String s) {\n    StringBuilder out = new StringBuilder();\n    Deque<Integer> starts = new ArrayDeque<>();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '(') {\n            starts.push(out.length());\n        } else if (c == ')') {\n            int st = starts.pop();\n            int a = st, b = out.length() - 1;\n            while (a < b) {\n                char t = out.charAt(a);\n                out.setCharAt(a, out.charAt(b));\n                out.setCharAt(b, t);\n                a++;\n                b--;\n            }\n        } else {\n            out.append(c);\n        }\n    }\n    return out.toString();\n}`,
              cpp: `string reverseParentheses(string s) {\n    string out;\n    vector<int> starts;\n    for (char c : s) {\n        if (c == '(') {\n            starts.push_back((int) out.size());\n        } else if (c == ')') {\n            int st = starts.back();\n            starts.pop_back();\n            reverse(out.begin() + st, out.end());\n        } else {\n            out.push_back(c);\n        }\n    }\n    return out;\n}`,
              c: `char* reverseParentheses(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc((size_t) n + 2);\n    int len = 0;\n    int* starts = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '(') {\n            starts[top++] = len;\n        } else if (s[i] == ')') {\n            int st = starts[--top];\n            int a = st, b = len - 1;\n            while (a < b) {\n                char t = out[a];\n                out[a] = out[b];\n                out[b] = t;\n                a++;\n                b--;\n            }\n        } else {\n            out[len++] = s[i];\n        }\n    }\n    out[len] = '\\0';\n    free(starts);\n    return out;\n}`,
              csharp: `public static string ReverseParentheses(string s)\n{\n    var out_ = new List<char>();\n    var starts = new List<int>();\n    foreach (char c in s)\n    {\n        if (c == '(')\n        {\n            starts.Add(out_.Count);\n        }\n        else if (c == ')')\n        {\n            int st = starts[starts.Count - 1];\n            starts.RemoveAt(starts.Count - 1);\n            int a = st, b = out_.Count - 1;\n            while (a < b)\n            {\n                char t = out_[a];\n                out_[a] = out_[b];\n                out_[b] = t;\n                a++;\n                b--;\n            }\n        }\n        else\n        {\n            out_.Add(c);\n        }\n    }\n    return new string(out_.ToArray());\n}`,
              go: `func reverseParentheses(s string) string {\n	out := []byte{}\n	starts := []int{}\n	for i := 0; i < len(s); i++ {\n		c := s[i]\n		if c == '(' {\n			starts = append(starts, len(out))\n		} else if c == ')' {\n			st := starts[len(starts)-1]\n			starts = starts[:len(starts)-1]\n			a, b := st, len(out)-1\n			for a < b {\n				out[a], out[b] = out[b], out[a]\n				a++\n				b--\n			}\n		} else {\n			out = append(out, c)\n		}\n	}\n	return string(out)\n}`,
              kotlin: `fun reverseParentheses(s: String): String {\n    val out = StringBuilder()\n    val starts = ArrayList<Int>()\n    for (c in s) {\n        if (c == '(') {\n            starts.add(out.length)\n        } else if (c == ')') {\n            val st = starts.removeAt(starts.size - 1)\n            var a = st\n            var b = out.length - 1\n            while (a < b) {\n                val t = out[a]\n                out.setCharAt(a, out[b])\n                out.setCharAt(b, t)\n                a++\n                b--\n            }\n        } else {\n            out.append(c)\n        }\n    }\n    return out.toString()\n}`,
              swift: `func reverseParentheses(_ s: String) -> String {\n    var out: [Character] = []\n    var starts: [Int] = []\n    for c in s {\n        if c == "(" {\n            starts.append(out.count)\n        } else if c == ")" {\n            let st = starts.removeLast()\n            var a = st\n            var b = out.count - 1\n            while a < b {\n                out.swapAt(a, b)\n                a += 1\n                b -= 1\n            }\n        } else {\n            out.append(c)\n        }\n    }\n    return String(out)\n}`,
              rust: `fn reverseParentheses(s: String) -> String {\n    let mut out: Vec<u8> = Vec::new();\n    let mut starts: Vec<usize> = Vec::new();\n    for c in s.bytes() {\n        if c == b'(' {\n            starts.push(out.len());\n        } else if c == b')' {\n            let st = starts.pop().unwrap();\n            out[st..].reverse();\n        } else {\n            out.push(c);\n        }\n    }\n    String::from_utf8(out).unwrap()\n}`,
              php: `function reverseParentheses($s) {\n    $out = array();\n    $starts = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        if ($c === "(") {\n            $starts[] = count($out);\n        } else if ($c === ")") {\n            $st = array_pop($starts);\n            $a = $st;\n            $b = count($out) - 1;\n            while ($a < $b) {\n                $t = $out[$a];\n                $out[$a] = $out[$b];\n                $out[$b] = $t;\n                $a++;\n                $b--;\n            }\n        } else {\n            $out[] = $c;\n        }\n    }\n    return implode("", $out);\n}`,
              ruby: `def reverseParentheses(s)\n  out = []\n  starts = []\n  s.each_char do |c|\n    if c == "("\n      starts.push(out.length)\n    elsif c == ")"\n      st = starts.pop\n      out[st..-1] = out[st..-1].reverse\n    else\n      out.push(c)\n    end\n  end\n  out.join\nend`,
      },
    };
  })(),

  // ── Time Needed to Buy Tickets ──────────────────────────────────
  (() => {
    const ref = (tickets: number[], k: number) => {
      let time = 0;
      for (let i = 0; i < tickets.length; i++) {
        if (i <= k) time += Math.min(tickets[i], tickets[k]);
        else time += Math.min(tickets[i], tickets[k] - 1);
      }
      return time;
    };
    return {
      slug: "time-needed-to-buy-tickets",
      title: "Time Needed to Buy Tickets",
      difficulty: "EASY" as const,
      tags: ["Array", "Queue", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "timeRequiredToBuy", params: [{ name: "tickets", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "People stand in a queue; `tickets[i]` is the number of tickets person `i` still wants. Buying one ticket takes exactly one second. After buying one ticket a person goes to the **back of the queue**, unless they are done, in which case they leave.\n\nReturn the number of seconds it takes the person at position `k` to buy all of their tickets.",
        [
          { in: "tickets = [2,3,2], k = 2", out: "6" },
          { in: "tickets = [5,1,1,1], k = 0", out: "8" },
          { in: "tickets = [1], k = 0", out: "1" },
        ],
        ["1 <= tickets.length <= 40", "1 <= tickets[i] <= 100", "0 <= k < tickets.length"]),
      hints: [
        "Simulating the queue works, but each person's contribution can be counted directly.",
        "Someone at or before `k` buys at most `tickets[k]` tickets before person `k` finishes.",
        "Someone after `k` gets one fewer round, so they contribute at most `tickets[k] - 1`.",
      ],
      examples: [
        { input: "[2,3,2]\n2", expectedOutput: "6" },
        { input: "[5,1,1,1]\n0", expectedOutput: "8" },
        { input: "[1]\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const tickets = randArr(rng, n, 1, rng() < 0.5 ? 8 : 100);
        const k = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(tickets)}\n${k}`, expectedOutput: String(ref(tickets, k)) };
      },
      solutions: {
        python: `def timeRequiredToBuy(tickets, k: int) -> int:\n    time = 0\n    for i, want in enumerate(tickets):\n        if i <= k:\n            time += min(want, tickets[k])\n        else:\n            time += min(want, tickets[k] - 1)\n    return time`,
        javascript: `var timeRequiredToBuy = function(tickets, k) {\n    let time = 0;\n    for (let i = 0; i < tickets.length; i++) {\n        if (i <= k) time += Math.min(tickets[i], tickets[k]);\n        else time += Math.min(tickets[i], tickets[k] - 1);\n    }\n    return time;\n};`,
              typescript: `function timeRequiredToBuy(tickets: number[], k: number): number {\n    var time = 0;\n    for (var i = 0; i < tickets.length; i++) {\n        if (i <= k) time += Math.min(tickets[i], tickets[k]);\n        else time += Math.min(tickets[i], tickets[k] - 1);\n    }\n    return time;\n}`,
              java: `public static int timeRequiredToBuy(int[] tickets, int k) {\n    int time = 0;\n    for (int i = 0; i < tickets.length; i++) {\n        if (i <= k) time += Math.min(tickets[i], tickets[k]);\n        else time += Math.min(tickets[i], tickets[k] - 1);\n    }\n    return time;\n}`,
              cpp: `int timeRequiredToBuy(vector<int>& tickets, int k) {\n    int time = 0;\n    for (int i = 0; i < (int) tickets.size(); i++) {\n        if (i <= k) time += min(tickets[i], tickets[k]);\n        else time += min(tickets[i], tickets[k] - 1);\n    }\n    return time;\n}`,
              c: `int timeRequiredToBuy(int* tickets, int ticketsSize, int k) {\n    int time = 0;\n    for (int i = 0; i < ticketsSize; i++) {\n        int cap = (i <= k) ? tickets[k] : tickets[k] - 1;\n        time += tickets[i] < cap ? tickets[i] : cap;\n    }\n    return time;\n}`,
              csharp: `public static int TimeRequiredToBuy(int[] tickets, int k)\n{\n    int time = 0;\n    for (int i = 0; i < tickets.Length; i++)\n    {\n        if (i <= k) time += Math.Min(tickets[i], tickets[k]);\n        else time += Math.Min(tickets[i], tickets[k] - 1);\n    }\n    return time;\n}`,
              go: `func timeRequiredToBuy(tickets []int, k int) int {\n	time := 0\n	for i := 0; i < len(tickets); i++ {\n		cap := tickets[k]\n		if i > k {\n			cap = tickets[k] - 1\n		}\n		if tickets[i] < cap {\n			time += tickets[i]\n		} else {\n			time += cap\n		}\n	}\n	return time\n}`,
              kotlin: `fun timeRequiredToBuy(tickets: IntArray, k: Int): Int {\n    var time = 0\n    for (i in tickets.indices) {\n        val cap = if (i <= k) tickets[k] else tickets[k] - 1\n        time += if (tickets[i] < cap) tickets[i] else cap\n    }\n    return time\n}`,
              swift: `func timeRequiredToBuy(_ tickets: [Int], _ k: Int) -> Int {\n    var time = 0\n    for i in 0..<tickets.count {\n        let cap = i <= k ? tickets[k] : tickets[k] - 1\n        time += min(tickets[i], cap)\n    }\n    return time\n}`,
              rust: `fn timeRequiredToBuy(tickets: Vec<i32>, k: i32) -> i32 {\n    let ks = k as usize;\n    let mut time = 0;\n    for i in 0..tickets.len() {\n        let cap = if i <= ks { tickets[ks] } else { tickets[ks] - 1 };\n        time += if tickets[i] < cap { tickets[i] } else { cap };\n    }\n    time\n}`,
              php: `function timeRequiredToBuy($tickets, $k) {\n    $time = 0;\n    $n = count($tickets);\n    for ($i = 0; $i < $n; $i++) {\n        $cap = $i <= $k ? $tickets[$k] : $tickets[$k] - 1;\n        $time += min($tickets[$i], $cap);\n    }\n    return $time;\n}`,
              ruby: `def timeRequiredToBuy(tickets, k)\n  time = 0\n  tickets.each_with_index do |want, i|\n    cap = i <= k ? tickets[k] : tickets[k] - 1\n    time += [want, cap].min\n  end\n  time\nend`,
      },
    };
  })(),


  // ── Reveal Cards In Increasing Order ────────────────────────────
  (() => {
    const ref = (deck: number[]) => {
      const sorted = deck.slice().sort((a, b) => a - b);
      const slots: number[] = [];
      for (let i = 0; i < deck.length; i++) slots.push(i);
      const out: number[] = [];
      for (let i = 0; i < deck.length; i++) out.push(0);
      for (let i = 0; i < sorted.length; i++) {
        out[slots.shift() as number] = sorted[i];
        if (slots.length > 0) slots.push(slots.shift() as number);
      }
      return out;
    };
    return {
      slug: "reveal-cards-in-increasing-order",
      title: "Reveal Cards In Increasing Order",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Queue", "Sorting", "Simulation", "Google", "Amazon"],
      signature: { funcName: "deckRevealedIncreasing", params: [{ name: "deck", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You have a deck of cards with **distinct** values, face down. You reveal them like this, repeating until the deck is empty:\n\n1. reveal the top card;\n2. if any cards remain, move the next top card to the bottom of the deck.\n\nReturn the ordering of the deck that would reveal the cards in **increasing** order.",
        [
          { in: "deck = [17,13,11,2,3,5,7]", out: "[2,13,3,11,5,17,7]" },
          { in: "deck = [1,1000]", out: "[1,1000]" },
          { in: "deck = [1]", out: "[1]" },
        ],
        ["1 <= deck.length <= 30", "1 <= deck[i] <= 1000000", "All values are distinct."]),
      hints: [
        "Run the reveal procedure on the **positions** 0, 1, …, n-1 instead of on the cards.",
        "That tells you the order in which slots get filled.",
        "Fill those slots with the sorted values, smallest first.",
      ],
      examples: [
        { input: "[17,13,11,2,3,5,7]", expectedOutput: "[2,13,3,11,5,17,7]" },
        { input: "[1,1000]", expectedOutput: "[1,1000]" },
        { input: "[1]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const values = new Set<number>();
        while (values.size < n) values.add(ri(rng, 1, 1000000));
        const deck = shuffle(rng, Array.from(values));
        return { input: fmtIntArr(deck), expectedOutput: fmtIntArr(ref(deck)) };
      },
      solutions: {
        python: `from collections import deque\n\ndef deckRevealedIncreasing(deck):\n    ordered = sorted(deck)\n    slots = deque(range(len(deck)))\n    out = [0] * len(deck)\n    for value in ordered:\n        out[slots.popleft()] = value\n        if slots:\n            slots.append(slots.popleft())\n    return out`,
        javascript: `var deckRevealedIncreasing = function(deck) {\n    const sorted = deck.slice().sort(function(a, b) { return a - b; });\n    const slots = [];\n    for (let i = 0; i < deck.length; i++) slots.push(i);\n    const out = [];\n    for (let i = 0; i < deck.length; i++) out.push(0);\n    let head = 0;\n    for (let i = 0; i < sorted.length; i++) {\n        out[slots[head++]] = sorted[i];\n        if (head < slots.length) {\n            slots.push(slots[head++]);\n        }\n    }\n    return out;\n};`,
              typescript: `function deckRevealedIncreasing(deck: number[]): number[] {\n    var sorted = deck.slice().sort(function (a, b) { return a - b; });\n    var slots: number[] = [];\n    for (var i = 0; i < deck.length; i++) slots.push(i);\n    var out: number[] = [];\n    for (var j = 0; j < deck.length; j++) out.push(0);\n    var head = 0;\n    for (var k = 0; k < sorted.length; k++) {\n        out[slots[head++]] = sorted[k];\n        if (head < slots.length) {\n            slots.push(slots[head++]);\n        }\n    }\n    return out;\n}`,
              java: `public static int[] deckRevealedIncreasing(int[] deck) {\n    int[] sorted = deck.clone();\n    Arrays.sort(sorted);\n    Deque<Integer> slots = new ArrayDeque<>();\n    for (int i = 0; i < deck.length; i++) slots.addLast(i);\n    int[] out = new int[deck.length];\n    for (int value : sorted) {\n        out[slots.pollFirst()] = value;\n        if (!slots.isEmpty()) slots.addLast(slots.pollFirst());\n    }\n    return out;\n}`,
              cpp: `vector<int> deckRevealedIncreasing(vector<int>& deck) {\n    vector<int> sorted = deck;\n    sort(sorted.begin(), sorted.end());\n    deque<int> slots;\n    for (int i = 0; i < (int) deck.size(); i++) slots.push_back(i);\n    vector<int> out(deck.size(), 0);\n    for (int value : sorted) {\n        out[slots.front()] = value;\n        slots.pop_front();\n        if (!slots.empty()) {\n            slots.push_back(slots.front());\n            slots.pop_front();\n        }\n    }\n    return out;\n}`,
              c: `static int cmpDeckAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* deckRevealedIncreasing(int* deck, int deckSize, int* returnSize) {\n    int* sorted = (int*) malloc((size_t) (deckSize > 0 ? deckSize : 1) * sizeof(int));\n    for (int i = 0; i < deckSize; i++) sorted[i] = deck[i];\n    qsort(sorted, deckSize, sizeof(int), cmpDeckAsc);\n    int* slots = (int*) malloc((size_t) (2 * deckSize + 2) * sizeof(int));\n    int head = 0, tail = 0;\n    for (int i = 0; i < deckSize; i++) slots[tail++] = i;\n    int* out = (int*) malloc((size_t) (deckSize > 0 ? deckSize : 1) * sizeof(int));\n    for (int i = 0; i < deckSize; i++) {\n        out[slots[head++]] = sorted[i];\n        if (head < tail) slots[tail++] = slots[head++];\n    }\n    free(sorted);\n    free(slots);\n    *returnSize = deckSize;\n    return out;\n}`,
              csharp: `public static int[] DeckRevealedIncreasing(int[] deck)\n{\n    int[] sorted = (int[]) deck.Clone();\n    Array.Sort(sorted);\n    var slots = new Queue<int>();\n    for (int i = 0; i < deck.Length; i++) slots.Enqueue(i);\n    int[] out_ = new int[deck.Length];\n    foreach (int value in sorted)\n    {\n        out_[slots.Dequeue()] = value;\n        if (slots.Count > 0) slots.Enqueue(slots.Dequeue());\n    }\n    return out_;\n}`,
              go: `func deckRevealedIncreasing(deck []int) []int {\n	sorted := append([]int{}, deck...)\n	sort.Ints(sorted)\n	slots := []int{}\n	for i := 0; i < len(deck); i++ {\n		slots = append(slots, i)\n	}\n	out := make([]int, len(deck))\n	head := 0\n	for _, value := range sorted {\n		out[slots[head]] = value\n		head++\n		if head < len(slots) {\n			slots = append(slots, slots[head])\n			head++\n		}\n	}\n	return out\n}`,
              kotlin: `fun deckRevealedIncreasing(deck: IntArray): IntArray {\n    val sorted = deck.sortedArray()\n    val slots = ArrayList<Int>()\n    for (i in deck.indices) slots.add(i)\n    val out = IntArray(deck.size)\n    var head = 0\n    for (value in sorted) {\n        out[slots[head]] = value\n        head++\n        if (head < slots.size) {\n            slots.add(slots[head])\n            head++\n        }\n    }\n    return out\n}`,
              swift: `func deckRevealedIncreasing(_ deck: [Int]) -> [Int] {\n    let sorted = deck.sorted()\n    var slots: [Int] = Array(0..<deck.count)\n    var out = [Int](repeating: 0, count: deck.count)\n    var head = 0\n    for value in sorted {\n        out[slots[head]] = value\n        head += 1\n        if head < slots.count {\n            slots.append(slots[head])\n            head += 1\n        }\n    }\n    return out\n}`,
              rust: `fn deckRevealedIncreasing(deck: Vec<i32>) -> Vec<i32> {\n    let mut sorted = deck.clone();\n    sorted.sort();\n    let mut slots: Vec<usize> = (0..deck.len()).collect();\n    let mut out = vec![0i32; deck.len()];\n    let mut head = 0usize;\n    for value in sorted.iter() {\n        out[slots[head]] = *value;\n        head += 1;\n        if head < slots.len() {\n            slots.push(slots[head]);\n            head += 1;\n        }\n    }\n    out\n}`,
              php: `function deckRevealedIncreasing($deck) {\n    $sorted = $deck;\n    sort($sorted);\n    $n = count($deck);\n    $slots = range(0, $n - 1);\n    $out = array_fill(0, $n, 0);\n    $head = 0;\n    foreach ($sorted as $value) {\n        $out[$slots[$head]] = $value;\n        $head++;\n        if ($head < count($slots)) {\n            $slots[] = $slots[$head];\n            $head++;\n        }\n    }\n    return $out;\n}`,
              ruby: `def deckRevealedIncreasing(deck)\n  sorted = deck.sort\n  slots = (0...deck.length).to_a\n  out = Array.new(deck.length, 0)\n  head = 0\n  sorted.each do |value|\n    out[slots[head]] = value\n    head += 1\n    if head < slots.length\n      slots.push(slots[head])\n      head += 1\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Dota2 Senate ────────────────────────────────────────────────
  (() => {
    const ref = (senate: string) => {
      const n = senate.length;
      const radiant: number[] = [];
      const dire: number[] = [];
      for (let i = 0; i < n; i++) {
        if (senate[i] === "R") radiant.push(i);
        else dire.push(i);
      }
      let r = 0, d = 0;
      while (r < radiant.length && d < dire.length) {
        const ri2 = radiant[r++];
        const di = dire[d++];
        if (ri2 < di) radiant.push(ri2 + n);
        else dire.push(di + n);
      }
      return r < radiant.length ? "Radiant" : "Dire";
    };
    return {
      slug: "dota2-senate",
      title: "Dota2 Senate",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Queue", "Amazon", "Microsoft"],
      signature: { funcName: "predictPartyVictory", params: [{ name: "senate", type: "string" as const }], returns: "string" as const },
      description: describe(
        "The senate has senators from the **Radiant** and **Dire** parties, given as a string of `'R'` and `'D'` in seating order. Voting proceeds in rounds; in each round every remaining senator, in order, may either **ban** one senator from the other party for the rest of the game, or — if only their own party remains — declare victory.\n\nAssuming every senator plays optimally, return the winning party: `\"Radiant\"` or `\"Dire\"`.",
        [
          { in: 'senate = "RD"', out: "Radiant" },
          { in: 'senate = "RDD"', out: "Dire" },
          { in: 'senate = "DRRDRDRDRDDRDRDR"', out: "Radiant" },
        ],
        ["1 <= senate.length <= 40", "senate consists of 'R' and 'D'."]),
      hints: [
        "A senator's best move is always to ban the **next** opposing senator who would otherwise act.",
        "Keep two queues of indices, one per party, and pop the front of each.",
        "Whoever has the smaller index bans the other and rejoins the queue with index `i + n`, representing the next round.",
      ],
      examples: [
        { input: '"RD"', expectedOutput: "Radiant" },
        { input: '"RDD"', expectedOutput: "Dire" },
        { input: '"DRRDRDRDRDDRDRDR"', expectedOutput: "Radiant" },
      ],
      gen: (rng: Rng) => {
        const senate = randStr(rng, 1, 40, "RD");
        return { input: `"${senate}"`, expectedOutput: ref(senate) };
      },
      solutions: {
        python: `from collections import deque\n\ndef predictPartyVictory(senate: str) -> str:\n    n = len(senate)\n    radiant = deque(i for i, ch in enumerate(senate) if ch == "R")\n    dire = deque(i for i, ch in enumerate(senate) if ch == "D")\n    while radiant and dire:\n        r = radiant.popleft()\n        d = dire.popleft()\n        if r < d:\n            radiant.append(r + n)\n        else:\n            dire.append(d + n)\n    return "Radiant" if radiant else "Dire"`,
        javascript: `var predictPartyVictory = function(senate) {\n    const n = senate.length;\n    const radiant = [], dire = [];\n    for (let i = 0; i < n; i++) {\n        if (senate.charAt(i) === "R") radiant.push(i);\n        else dire.push(i);\n    }\n    let r = 0, d = 0;\n    while (r < radiant.length && d < dire.length) {\n        const ri = radiant[r++];\n        const di = dire[d++];\n        if (ri < di) radiant.push(ri + n);\n        else dire.push(di + n);\n    }\n    return r < radiant.length ? "Radiant" : "Dire";\n};`,
              typescript: `function predictPartyVictory(senate: string): string {\n    var n = senate.length;\n    var radiant: number[] = [];\n    var dire: number[] = [];\n    for (var i = 0; i < n; i++) {\n        if (senate.charAt(i) === "R") radiant.push(i);\n        else dire.push(i);\n    }\n    var r = 0;\n    var d = 0;\n    while (r < radiant.length && d < dire.length) {\n        var ri = radiant[r++];\n        var di = dire[d++];\n        if (ri < di) radiant.push(ri + n);\n        else dire.push(di + n);\n    }\n    return r < radiant.length ? "Radiant" : "Dire";\n}`,
              java: `public static String predictPartyVictory(String senate) {\n    int n = senate.length();\n    List<Integer> radiant = new ArrayList<>();\n    List<Integer> dire = new ArrayList<>();\n    for (int i = 0; i < n; i++) {\n        if (senate.charAt(i) == 'R') radiant.add(i);\n        else dire.add(i);\n    }\n    int r = 0, d = 0;\n    while (r < radiant.size() && d < dire.size()) {\n        int ri = radiant.get(r++);\n        int di = dire.get(d++);\n        if (ri < di) radiant.add(ri + n);\n        else dire.add(di + n);\n    }\n    return r < radiant.size() ? "Radiant" : "Dire";\n}`,
              cpp: `string predictPartyVictory(string senate) {\n    int n = (int) senate.size();\n    vector<int> radiant, dire;\n    for (int i = 0; i < n; i++) {\n        if (senate[i] == 'R') radiant.push_back(i);\n        else dire.push_back(i);\n    }\n    size_t r = 0, d = 0;\n    while (r < radiant.size() && d < dire.size()) {\n        int ri = radiant[r++];\n        int di = dire[d++];\n        if (ri < di) radiant.push_back(ri + n);\n        else dire.push_back(di + n);\n    }\n    return r < radiant.size() ? "Radiant" : "Dire";\n}`,
              c: `char* predictPartyVictory(const char* senate) {\n    int n = (int) strlen(senate);\n    int cap = 4 * n + 8;\n    int* radiant = (int*) malloc((size_t) cap * sizeof(int));\n    int* dire = (int*) malloc((size_t) cap * sizeof(int));\n    int rTail = 0, dTail = 0;\n    for (int i = 0; i < n; i++) {\n        if (senate[i] == 'R') radiant[rTail++] = i;\n        else dire[dTail++] = i;\n    }\n    int r = 0, d = 0;\n    while (r < rTail && d < dTail) {\n        int ri = radiant[r++];\n        int di = dire[d++];\n        if (ri < di) {\n            if (rTail < cap) radiant[rTail++] = ri + n;\n        } else {\n            if (dTail < cap) dire[dTail++] = di + n;\n        }\n    }\n    int radiantWins = (r < rTail);\n    free(radiant);\n    free(dire);\n    char* out = (char*) malloc(16);\n    strcpy(out, radiantWins ? "Radiant" : "Dire");\n    return out;\n}`,
              csharp: `public static string PredictPartyVictory(string senate)\n{\n    int n = senate.Length;\n    var radiant = new List<int>();\n    var dire = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        if (senate[i] == 'R') radiant.Add(i);\n        else dire.Add(i);\n    }\n    int r = 0, d = 0;\n    while (r < radiant.Count && d < dire.Count)\n    {\n        int ri = radiant[r++];\n        int di = dire[d++];\n        if (ri < di) radiant.Add(ri + n);\n        else dire.Add(di + n);\n    }\n    return r < radiant.Count ? "Radiant" : "Dire";\n}`,
              go: `func predictPartyVictory(senate string) string {\n	n := len(senate)\n	radiant := []int{}\n	dire := []int{}\n	for i := 0; i < n; i++ {\n		if senate[i] == 'R' {\n			radiant = append(radiant, i)\n		} else {\n			dire = append(dire, i)\n		}\n	}\n	r, d := 0, 0\n	for r < len(radiant) && d < len(dire) {\n		ri := radiant[r]\n		di := dire[d]\n		r++\n		d++\n		if ri < di {\n			radiant = append(radiant, ri+n)\n		} else {\n			dire = append(dire, di+n)\n		}\n	}\n	if r < len(radiant) {\n		return "Radiant"\n	}\n	return "Dire"\n}`,
              kotlin: `fun predictPartyVictory(senate: String): String {\n    val n = senate.length\n    val radiant = ArrayList<Int>()\n    val dire = ArrayList<Int>()\n    for (i in 0 until n) {\n        if (senate[i] == 'R') radiant.add(i) else dire.add(i)\n    }\n    var r = 0\n    var d = 0\n    while (r < radiant.size && d < dire.size) {\n        val ri = radiant[r++]\n        val di = dire[d++]\n        if (ri < di) radiant.add(ri + n) else dire.add(di + n)\n    }\n    return if (r < radiant.size) "Radiant" else "Dire"\n}`,
              swift: `func predictPartyVictory(_ senate: String) -> String {\n    let chars = Array(senate)\n    let n = chars.count\n    var radiant: [Int] = []\n    var dire: [Int] = []\n    for i in 0..<n {\n        if chars[i] == "R" { radiant.append(i) } else { dire.append(i) }\n    }\n    var r = 0\n    var d = 0\n    while r < radiant.count && d < dire.count {\n        let ri = radiant[r]\n        let di = dire[d]\n        r += 1\n        d += 1\n        if ri < di { radiant.append(ri + n) } else { dire.append(di + n) }\n    }\n    return r < radiant.count ? "Radiant" : "Dire"\n}`,
              rust: `fn predictPartyVictory(senate: String) -> String {\n    let chars: Vec<u8> = senate.bytes().collect();\n    let n = chars.len();\n    let mut radiant: Vec<usize> = Vec::new();\n    let mut dire: Vec<usize> = Vec::new();\n    for i in 0..n {\n        if chars[i] == b'R' {\n            radiant.push(i);\n        } else {\n            dire.push(i);\n        }\n    }\n    let mut r = 0usize;\n    let mut d = 0usize;\n    while r < radiant.len() && d < dire.len() {\n        let ri = radiant[r];\n        let di = dire[d];\n        r += 1;\n        d += 1;\n        if ri < di {\n            radiant.push(ri + n);\n        } else {\n            dire.push(di + n);\n        }\n    }\n    if r < radiant.len() {\n        String::from("Radiant")\n    } else {\n        String::from("Dire")\n    }\n}`,
              php: `function predictPartyVictory($senate) {\n    $n = strlen($senate);\n    $radiant = array();\n    $dire = array();\n    for ($i = 0; $i < $n; $i++) {\n        if ($senate[$i] === "R") $radiant[] = $i;\n        else $dire[] = $i;\n    }\n    $r = 0;\n    $d = 0;\n    while ($r < count($radiant) && $d < count($dire)) {\n        $ri = $radiant[$r++];\n        $di = $dire[$d++];\n        if ($ri < $di) $radiant[] = $ri + $n;\n        else $dire[] = $di + $n;\n    }\n    return $r < count($radiant) ? "Radiant" : "Dire";\n}`,
              ruby: `def predictPartyVictory(senate)\n  n = senate.length\n  radiant = []\n  dire = []\n  senate.each_char.with_index do |c, i|\n    c == "R" ? radiant.push(i) : dire.push(i)\n  end\n  r = 0\n  d = 0\n  while r < radiant.length && d < dire.length\n    ri = radiant[r]\n    di = dire[d]\n    r += 1\n    d += 1\n    if ri < di\n      radiant.push(ri + n)\n    else\n      dire.push(di + n)\n    end\n  end\n  r < radiant.length ? "Radiant" : "Dire"\nend`,
      },
    };
  })(),

  // ── Number of Students Unable to Eat Lunch ──────────────────────
  (() => {
    const ref = (students: number[], sandwiches: number[]) => {
      const want = [0, 0];
      for (let i = 0; i < students.length; i++) want[students[i]]++;
      let served = 0;
      for (let i = 0; i < sandwiches.length; i++) {
        if (want[sandwiches[i]] === 0) break;
        want[sandwiches[i]]--;
        served++;
      }
      return students.length - served;
    };
    return {
      slug: "number-of-students-unable-to-eat-lunch",
      title: "Number of Students Unable to Eat Lunch",
      difficulty: "EASY" as const,
      tags: ["Array", "Stack", "Queue", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "countStudents", params: [{ name: "students", type: "int[]" as const }, { name: "sandwiches", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Students queue for lunch. Sandwiches sit in a stack; `sandwiches[0]` is on top. Each sandwich is either round (`0`) or square (`1`), and each student prefers one kind.\n\nThe student at the front takes the top sandwich if it matches their preference, otherwise they go to the back of the queue. This repeats until nobody left in the queue wants the sandwich on top.\n\nReturn the number of students who never eat.",
        [
          { in: "students = [1,1,0,0], sandwiches = [0,1,0,1]", out: "0" },
          { in: "students = [1,1,1,0,0,1], sandwiches = [1,0,0,0,1,1]", out: "3" },
          { in: "students = [0], sandwiches = [1]", out: "1" },
        ],
        ["1 <= students.length <= 40", "sandwiches.length == students.length", "students[i] and sandwiches[i] are 0 or 1."]),
      hints: [
        "Rotating the queue never changes **which** preferences are still present, only their order.",
        "So all that matters is how many students still want each kind.",
        "Walk the sandwich stack, serving while someone still wants the top one; stop at the first sandwich nobody wants.",
      ],
      examples: [
        { input: "[1,1,0,0]\n[0,1,0,1]", expectedOutput: "0" },
        { input: "[1,1,1,0,0,1]\n[1,0,0,0,1,1]", expectedOutput: "3" },
        { input: "[0]\n[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const students = randArr(rng, n, 0, 1);
        const sandwiches = randArr(rng, n, 0, 1);
        return { input: `${fmtIntArr(students)}\n${fmtIntArr(sandwiches)}`, expectedOutput: String(ref(students, sandwiches)) };
      },
      solutions: {
        python: `def countStudents(students, sandwiches) -> int:\n    want = [0, 0]\n    for s in students:\n        want[s] += 1\n    served = 0\n    for kind in sandwiches:\n        if want[kind] == 0:\n            break\n        want[kind] -= 1\n        served += 1\n    return len(students) - served`,
        javascript: `var countStudents = function(students, sandwiches) {\n    const want = [0, 0];\n    for (let i = 0; i < students.length; i++) want[students[i]]++;\n    let served = 0;\n    for (let i = 0; i < sandwiches.length; i++) {\n        if (want[sandwiches[i]] === 0) break;\n        want[sandwiches[i]]--;\n        served++;\n    }\n    return students.length - served;\n};`,
              typescript: `function countStudents(students: number[], sandwiches: number[]): number {\n    var want = [0, 0];\n    for (var i = 0; i < students.length; i++) want[students[i]]++;\n    var served = 0;\n    for (var j = 0; j < sandwiches.length; j++) {\n        if (want[sandwiches[j]] === 0) break;\n        want[sandwiches[j]]--;\n        served++;\n    }\n    return students.length - served;\n}`,
              java: `public static int countStudents(int[] students, int[] sandwiches) {\n    int[] want = new int[2];\n    for (int s : students) want[s]++;\n    int served = 0;\n    for (int kind : sandwiches) {\n        if (want[kind] == 0) break;\n        want[kind]--;\n        served++;\n    }\n    return students.length - served;\n}`,
              cpp: `int countStudents(vector<int>& students, vector<int>& sandwiches) {\n    int want[2] = {0, 0};\n    for (int s : students) want[s]++;\n    int served = 0;\n    for (int kind : sandwiches) {\n        if (want[kind] == 0) break;\n        want[kind]--;\n        served++;\n    }\n    return (int) students.size() - served;\n}`,
              c: `int countStudents(int* students, int studentsSize, int* sandwiches, int sandwichesSize) {\n    int want[2] = {0, 0};\n    for (int i = 0; i < studentsSize; i++) want[students[i]]++;\n    int served = 0;\n    for (int i = 0; i < sandwichesSize; i++) {\n        if (want[sandwiches[i]] == 0) break;\n        want[sandwiches[i]]--;\n        served++;\n    }\n    return studentsSize - served;\n}`,
              csharp: `public static int CountStudents(int[] students, int[] sandwiches)\n{\n    int[] want = new int[2];\n    foreach (int s in students) want[s]++;\n    int served = 0;\n    foreach (int kind in sandwiches)\n    {\n        if (want[kind] == 0) break;\n        want[kind]--;\n        served++;\n    }\n    return students.Length - served;\n}`,
              go: `func countStudents(students []int, sandwiches []int) int {\n	want := [2]int{}\n	for _, s := range students {\n		want[s]++\n	}\n	served := 0\n	for _, kind := range sandwiches {\n		if want[kind] == 0 {\n			break\n		}\n		want[kind]--\n		served++\n	}\n	return len(students) - served\n}`,
              kotlin: `fun countStudents(students: IntArray, sandwiches: IntArray): Int {\n    val want = IntArray(2)\n    for (s in students) want[s]++\n    var served = 0\n    for (kind in sandwiches) {\n        if (want[kind] == 0) break\n        want[kind]--\n        served++\n    }\n    return students.size - served\n}`,
              swift: `func countStudents(_ students: [Int], _ sandwiches: [Int]) -> Int {\n    var want = [0, 0]\n    for s in students { want[s] += 1 }\n    var served = 0\n    for kind in sandwiches {\n        if want[kind] == 0 { break }\n        want[kind] -= 1\n        served += 1\n    }\n    return students.count - served\n}`,
              rust: `fn countStudents(students: Vec<i32>, sandwiches: Vec<i32>) -> i32 {\n    let mut want = [0i32; 2];\n    for s in students.iter() {\n        want[*s as usize] += 1;\n    }\n    let mut served = 0;\n    for kind in sandwiches.iter() {\n        if want[*kind as usize] == 0 {\n            break;\n        }\n        want[*kind as usize] -= 1;\n        served += 1;\n    }\n    students.len() as i32 - served\n}`,
              php: `function countStudents($students, $sandwiches) {\n    $want = array(0, 0);\n    foreach ($students as $s) $want[$s]++;\n    $served = 0;\n    foreach ($sandwiches as $kind) {\n        if ($want[$kind] === 0) break;\n        $want[$kind]--;\n        $served++;\n    }\n    return count($students) - $served;\n}`,
              ruby: `def countStudents(students, sandwiches)\n  want = [0, 0]\n  students.each { |s| want[s] += 1 }\n  served = 0\n  sandwiches.each do |kind|\n    break if want[kind] == 0\n    want[kind] -= 1\n    served += 1\n  end\n  students.length - served\nend`,
      },
    };
  })(),

  // ── Minimum String Length After Removing Substrings ─────────────
  (() => {
    const ref = (s: string) => {
      const stack: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        const top = stack.length > 0 ? stack[stack.length - 1] : "";
        if ((c === "B" && top === "A") || (c === "D" && top === "C")) stack.pop();
        else stack.push(c);
      }
      return stack.length;
    };
    return {
      slug: "minimum-string-length-after-removing-substrings",
      title: "Minimum String Length After Removing Substrings",
      difficulty: "EASY" as const,
      tags: ["String", "Stack", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "minLength", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        'You are given a string `s` of uppercase letters. In one operation you may remove any occurrence of the substring `"AB"` or `"CD"`.\n\nRemoving one may create a new one. Return the minimum possible length of the string after any number of operations.',
        [
          { in: 's = "ABFCACDB"', out: "2", note: 'Repeated removals leave "FC".' },
          { in: 's = "ACBBD"', out: "5", note: "Nothing can be removed." },
          { in: 's = "ABCD"', out: "0" },
        ],
        ["1 <= s.length <= 40", "s consists of uppercase English letters."]),
      hints: [
        "The order of removals does not change the final length, so a single left-to-right pass suffices.",
        'Push characters on a stack, but cancel when a `B` lands on an `A`, or a `D` on a `C`.',
        "Cancelling exposes the character underneath, letting chains collapse naturally.",
      ],
      examples: [
        { input: '"ABFCACDB"', expectedOutput: "2" },
        { input: '"ACBBD"', expectedOutput: "5" },
        { input: '"ABCD"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.7 ? "ABCD" : "ABCDEF";
        const s = randStr(rng, 1, 40, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minLength(s: str) -> int:\n    stack = []\n    for ch in s:\n        if stack and ((ch == "B" and stack[-1] == "A") or (ch == "D" and stack[-1] == "C")):\n            stack.pop()\n        else:\n            stack.append(ch)\n    return len(stack)`,
        javascript: `var minLength = function(s) {\n    const stack = [];\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        const top = stack.length > 0 ? stack[stack.length - 1] : "";\n        if ((c === "B" && top === "A") || (c === "D" && top === "C")) stack.pop();\n        else stack.push(c);\n    }\n    return stack.length;\n};`,
              typescript: `function minLength(s: string): number {\n    var stack: string[] = [];\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        var top = stack.length > 0 ? stack[stack.length - 1] : "";\n        if ((c === "B" && top === "A") || (c === "D" && top === "C")) stack.pop();\n        else stack.push(c);\n    }\n    return stack.length;\n}`,
              java: `public static int minLength(String s) {\n    StringBuilder stack = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        char top = stack.length() > 0 ? stack.charAt(stack.length() - 1) : ' ';\n        if ((c == 'B' && top == 'A') || (c == 'D' && top == 'C')) stack.deleteCharAt(stack.length() - 1);\n        else stack.append(c);\n    }\n    return stack.length();\n}`,
              cpp: `int minLength(string s) {\n    string stk;\n    for (char c : s) {\n        char top = stk.empty() ? ' ' : stk.back();\n        if ((c == 'B' && top == 'A') || (c == 'D' && top == 'C')) stk.pop_back();\n        else stk.push_back(c);\n    }\n    return (int) stk.size();\n}`,
              c: `int minLength(const char* s) {\n    int n = (int) strlen(s);\n    char* stack = (char*) malloc((size_t) n + 1);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        char prev = top > 0 ? stack[top - 1] : ' ';\n        if ((s[i] == 'B' && prev == 'A') || (s[i] == 'D' && prev == 'C')) top--;\n        else stack[top++] = s[i];\n    }\n    free(stack);\n    return top;\n}`,
              csharp: `public static int MinLength(string s)\n{\n    var stack = new List<char>();\n    foreach (char c in s)\n    {\n        char top = stack.Count > 0 ? stack[stack.Count - 1] : ' ';\n        if ((c == 'B' && top == 'A') || (c == 'D' && top == 'C')) stack.RemoveAt(stack.Count - 1);\n        else stack.Add(c);\n    }\n    return stack.Count;\n}`,
              go: `func minLength(s string) int {\n	stack := []byte{}\n	for i := 0; i < len(s); i++ {\n		var top byte = ' '\n		if len(stack) > 0 {\n			top = stack[len(stack)-1]\n		}\n		if (s[i] == 'B' && top == 'A') || (s[i] == 'D' && top == 'C') {\n			stack = stack[:len(stack)-1]\n		} else {\n			stack = append(stack, s[i])\n		}\n	}\n	return len(stack)\n}`,
              kotlin: `fun minLength(s: String): Int {\n    val stack = StringBuilder()\n    for (c in s) {\n        val top = if (stack.isNotEmpty()) stack[stack.length - 1] else ' '\n        if ((c == 'B' && top == 'A') || (c == 'D' && top == 'C')) stack.deleteCharAt(stack.length - 1)\n        else stack.append(c)\n    }\n    return stack.length\n}`,
              swift: `func minLength(_ s: String) -> Int {\n    var stack: [Character] = []\n    for c in s {\n        let top: Character = stack.last ?? " "\n        if (c == "B" && top == "A") || (c == "D" && top == "C") {\n            stack.removeLast()\n        } else {\n            stack.append(c)\n        }\n    }\n    return stack.count\n}`,
              rust: `fn minLength(s: String) -> i32 {\n    let mut stack: Vec<u8> = Vec::new();\n    for c in s.bytes() {\n        let top = if stack.is_empty() { b' ' } else { stack[stack.len() - 1] };\n        if (c == b'B' && top == b'A') || (c == b'D' && top == b'C') {\n            stack.pop();\n        } else {\n            stack.push(c);\n        }\n    }\n    stack.len() as i32\n}`,
              php: `function minLength($s) {\n    $stack = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        $top = count($stack) > 0 ? $stack[count($stack) - 1] : " ";\n        if (($c === "B" && $top === "A") || ($c === "D" && $top === "C")) array_pop($stack);\n        else $stack[] = $c;\n    }\n    return count($stack);\n}`,
              ruby: `def minLength(s)\n  stack = []\n  s.each_char do |c|\n    top = stack.empty? ? " " : stack[-1]\n    if (c == "B" && top == "A") || (c == "D" && top == "C")\n      stack.pop\n    else\n      stack.push(c)\n    end\n  end\n  stack.length\nend`,
      },
    };
  })(),

  // ── Removing Stars From a String ────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const stack: string[] = [];
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "*") stack.pop();
        else stack.push(s[i]);
      }
      return stack.join("");
    };
    return {
      slug: "removing-stars-from-a-string",
      title: "Removing Stars From a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "removeStars", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` containing stars `*`. In one operation you choose a star and remove it together with the **closest non-star character to its left**.\n\nApply the operation until no stars remain and return the resulting string. The answer is unique.",
        [
          { in: 's = "leet**cod*e"', out: "lecoe" },
          { in: 's = "erase*****"', out: "" },
          { in: 's = "ab*c"', out: "ac" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters and '*'.", "The operation is always possible."]),
      hints: [
        "Each star deletes the most recently kept character — that is exactly a stack pop.",
        "Push letters, pop on a star.",
        "Whatever is left on the stack, joined in order, is the answer.",
      ],
      examples: [
        { input: '"leet**cod*e"', expectedOutput: "lecoe" },
        { input: '"erase*****"', expectedOutput: "" },
        { input: '"ab*c"', expectedOutput: "ac" },
      ],
      gen: (rng: Rng) => {
        // Build the string so a star never outnumbers the letters before it.
        const n = ri(rng, 1, 40);
        let s = "";
        let available = 0;
        for (let i = 0; i < n; i++) {
          if (available > 0 && rng() < 0.35) {
            s += "*";
            available--;
          } else {
            s += "abcde"[ri(rng, 0, 4)];
            available++;
          }
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def removeStars(s: str) -> str:\n    stack = []\n    for ch in s:\n        if ch == "*":\n            stack.pop()\n        else:\n            stack.append(ch)\n    return "".join(stack)`,
        javascript: `var removeStars = function(s) {\n    const stack = [];\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "*") stack.pop();\n        else stack.push(s.charAt(i));\n    }\n    return stack.join("");\n};`,
              typescript: `function removeStars(s: string): string {\n    var stack: string[] = [];\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "*") stack.pop();\n        else stack.push(s.charAt(i));\n    }\n    return stack.join("");\n}`,
              java: `public static String removeStars(String s) {\n    StringBuilder stack = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '*') stack.deleteCharAt(stack.length() - 1);\n        else stack.append(c);\n    }\n    return stack.toString();\n}`,
              cpp: `string removeStars(string s) {\n    string stk;\n    for (char c : s) {\n        if (c == '*') stk.pop_back();\n        else stk.push_back(c);\n    }\n    return stk;\n}`,
              c: `char* removeStars(const char* s) {\n    int n = (int) strlen(s);\n    char* stack = (char*) malloc((size_t) n + 2);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '*') top--;\n        else stack[top++] = s[i];\n    }\n    stack[top] = '\\0';\n    return stack;\n}`,
              csharp: `public static string RemoveStars(string s)\n{\n    var stack = new List<char>();\n    foreach (char c in s)\n    {\n        if (c == '*') stack.RemoveAt(stack.Count - 1);\n        else stack.Add(c);\n    }\n    return new string(stack.ToArray());\n}`,
              go: `func removeStars(s string) string {\n	stack := []byte{}\n	for i := 0; i < len(s); i++ {\n		if s[i] == '*' {\n			stack = stack[:len(stack)-1]\n		} else {\n			stack = append(stack, s[i])\n		}\n	}\n	return string(stack)\n}`,
              kotlin: `fun removeStars(s: String): String {\n    val stack = StringBuilder()\n    for (c in s) {\n        if (c == '*') stack.deleteCharAt(stack.length - 1)\n        else stack.append(c)\n    }\n    return stack.toString()\n}`,
              swift: `func removeStars(_ s: String) -> String {\n    var stack: [Character] = []\n    for c in s {\n        if c == "*" {\n            stack.removeLast()\n        } else {\n            stack.append(c)\n        }\n    }\n    return String(stack)\n}`,
              rust: `fn removeStars(s: String) -> String {\n    let mut stack: Vec<u8> = Vec::new();\n    for c in s.bytes() {\n        if c == b'*' {\n            stack.pop();\n        } else {\n            stack.push(c);\n        }\n    }\n    String::from_utf8(stack).unwrap()\n}`,
              php: `function removeStars($s) {\n    $stack = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "*") array_pop($stack);\n        else $stack[] = $s[$i];\n    }\n    return implode("", $stack);\n}`,
              ruby: `def removeStars(s)\n  stack = []\n  s.each_char do |c|\n    if c == "*"\n      stack.pop\n    else\n      stack.push(c)\n    end\n  end\n  stack.join\nend`,
      },
    };
  })(),

  // ── Sum of Subarray Ranges ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0;
      for (let i = 0; i < nums.length; i++) {
        let lo = nums[i], hi = nums[i];
        for (let j = i; j < nums.length; j++) {
          if (nums[j] < lo) lo = nums[j];
          if (nums[j] > hi) hi = nums[j];
          total += hi - lo;
        }
      }
      return total;
    };
    return {
      slug: "sum-of-subarray-ranges",
      title: "Sum of Subarray Ranges",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Google"],
      signature: { funcName: "subArrayRanges", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **range** of a subarray is the difference between its largest and smallest element.\n\nGiven an integer array `nums`, return the sum of the ranges of all its contiguous non-empty subarrays.",
        [
          { in: "nums = [1,2,3]", out: "4", note: "The ranges are 0,0,0,1,1,2." },
          { in: "nums = [1,3,3]", out: "4" },
          { in: "nums = [4,-2,-3,4,1]", out: "59" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"],
        "The O(n²) sweep is straightforward. Can you do it in O(n) with two monotonic stacks — sum of maximums minus sum of minimums?"),
      hints: [
        "Fix the left end and extend right, keeping a running minimum and maximum.",
        "Each extension contributes `max - min` in constant time, giving O(n²).",
        "For O(n), note the answer is the sum of subarray maximums minus the sum of subarray minimums, each computable with a monotonic stack.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "4" },
        { input: "[1,3,3]", expectedOutput: "4" },
        { input: "[4,-2,-3,4,1]", expectedOutput: "59" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def subArrayRanges(nums) -> int:\n    total = 0\n    n = len(nums)\n    for i in range(n):\n        lo = hi = nums[i]\n        for j in range(i, n):\n            lo = min(lo, nums[j])\n            hi = max(hi, nums[j])\n            total += hi - lo\n    return total`,
        javascript: `var subArrayRanges = function(nums) {\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) {\n        let lo = nums[i], hi = nums[i];\n        for (let j = i; j < nums.length; j++) {\n            if (nums[j] < lo) lo = nums[j];\n            if (nums[j] > hi) hi = nums[j];\n            total += hi - lo;\n        }\n    }\n    return total;\n};`,
              typescript: `function subArrayRanges(nums: number[]): number {\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var lo = nums[i];\n        var hi = nums[i];\n        for (var j = i; j < nums.length; j++) {\n            if (nums[j] < lo) lo = nums[j];\n            if (nums[j] > hi) hi = nums[j];\n            total += hi - lo;\n        }\n    }\n    return total;\n}`,
              java: `public static int subArrayRanges(int[] nums) {\n    int total = 0;\n    for (int i = 0; i < nums.length; i++) {\n        int lo = nums[i], hi = nums[i];\n        for (int j = i; j < nums.length; j++) {\n            lo = Math.min(lo, nums[j]);\n            hi = Math.max(hi, nums[j]);\n            total += hi - lo;\n        }\n    }\n    return total;\n}`,
              cpp: `int subArrayRanges(vector<int>& nums) {\n    int total = 0;\n    int n = (int) nums.size();\n    for (int i = 0; i < n; i++) {\n        int lo = nums[i], hi = nums[i];\n        for (int j = i; j < n; j++) {\n            lo = min(lo, nums[j]);\n            hi = max(hi, nums[j]);\n            total += hi - lo;\n        }\n    }\n    return total;\n}`,
              c: `int subArrayRanges(int* nums, int numsSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int lo = nums[i], hi = nums[i];\n        for (int j = i; j < numsSize; j++) {\n            if (nums[j] < lo) lo = nums[j];\n            if (nums[j] > hi) hi = nums[j];\n            total += hi - lo;\n        }\n    }\n    return total;\n}`,
              csharp: `public static int SubArrayRanges(int[] nums)\n{\n    int total = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int lo = nums[i], hi = nums[i];\n        for (int j = i; j < nums.Length; j++)\n        {\n            lo = Math.Min(lo, nums[j]);\n            hi = Math.Max(hi, nums[j]);\n            total += hi - lo;\n        }\n    }\n    return total;\n}`,
              go: `func subArrayRanges(nums []int) int {\n	total := 0\n	for i := 0; i < len(nums); i++ {\n		lo, hi := nums[i], nums[i]\n		for j := i; j < len(nums); j++ {\n			if nums[j] < lo {\n				lo = nums[j]\n			}\n			if nums[j] > hi {\n				hi = nums[j]\n			}\n			total += hi - lo\n		}\n	}\n	return total\n}`,
              kotlin: `fun subArrayRanges(nums: IntArray): Int {\n    var total = 0\n    for (i in nums.indices) {\n        var lo = nums[i]\n        var hi = nums[i]\n        for (j in i until nums.size) {\n            if (nums[j] < lo) lo = nums[j]\n            if (nums[j] > hi) hi = nums[j]\n            total += hi - lo\n        }\n    }\n    return total\n}`,
              swift: `func subArrayRanges(_ nums: [Int]) -> Int {\n    var total = 0\n    for i in 0..<nums.count {\n        var lo = nums[i]\n        var hi = nums[i]\n        for j in i..<nums.count {\n            if nums[j] < lo { lo = nums[j] }\n            if nums[j] > hi { hi = nums[j] }\n            total += hi - lo\n        }\n    }\n    return total\n}`,
              rust: `fn subArrayRanges(nums: Vec<i32>) -> i32 {\n    let mut total = 0i32;\n    for i in 0..nums.len() {\n        let mut lo = nums[i];\n        let mut hi = nums[i];\n        for j in i..nums.len() {\n            if nums[j] < lo {\n                lo = nums[j];\n            }\n            if nums[j] > hi {\n                hi = nums[j];\n            }\n            total += hi - lo;\n        }\n    }\n    total\n}`,
              php: `function subArrayRanges($nums) {\n    $total = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        $lo = $nums[$i];\n        $hi = $nums[$i];\n        for ($j = $i; $j < $n; $j++) {\n            if ($nums[$j] < $lo) $lo = $nums[$j];\n            if ($nums[$j] > $hi) $hi = $nums[$j];\n            $total += $hi - $lo;\n        }\n    }\n    return $total;\n}`,
              ruby: `def subArrayRanges(nums)\n  total = 0\n  n = nums.length\n  (0...n).each do |i|\n    lo = nums[i]\n    hi = nums[i]\n    (i...n).each do |j|\n      lo = nums[j] if nums[j] < lo\n      hi = nums[j] if nums[j] > hi\n      total += hi - lo\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Max Chunks To Make Sorted ───────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let chunks = 0, running = -1;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] > running) running = arr[i];
        if (running === i) chunks++;
      }
      return chunks;
    };
    return {
      slug: "max-chunks-to-make-sorted",
      title: "Max Chunks To Make Sorted",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Greedy", "Monotonic Stack", "Sorting", "Google", "Amazon"],
      signature: { funcName: "maxChunksToSorted", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `arr` that is a permutation of `[0, 1, …, n-1]`.\n\nSplit it into the largest possible number of contiguous chunks such that sorting each chunk individually and concatenating them yields the fully sorted array. Return that number of chunks.",
        [
          { in: "arr = [4,3,2,1,0]", out: "1", note: "Any split would leave the array unsorted." },
          { in: "arr = [1,0,2,3,4]", out: "4" },
          { in: "arr = [0,1,2]", out: "3" },
        ],
        ["1 <= arr.length <= 40", "arr is a permutation of [0, 1, …, arr.length - 1]."]),
      hints: [
        "A chunk can end at index `i` only if it holds exactly the values `0…i` in some order.",
        "Because the array is a permutation, that happens precisely when the maximum of the prefix equals `i`.",
        "Sweep once, tracking the running maximum, and count every index where it matches.",
      ],
      examples: [
        { input: "[4,3,2,1,0]", expectedOutput: "1" },
        { input: "[1,0,2,3,4]", expectedOutput: "4" },
        { input: "[0,1,2]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const arr = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `def maxChunksToSorted(arr) -> int:\n    chunks = 0\n    running = -1\n    for i, x in enumerate(arr):\n        running = max(running, x)\n        if running == i:\n            chunks += 1\n    return chunks`,
        javascript: `var maxChunksToSorted = function(arr) {\n    let chunks = 0, running = -1;\n    for (let i = 0; i < arr.length; i++) {\n        if (arr[i] > running) running = arr[i];\n        if (running === i) chunks++;\n    }\n    return chunks;\n};`,
              typescript: `function maxChunksToSorted(arr: number[]): number {\n    var chunks = 0;\n    var running = -1;\n    for (var i = 0; i < arr.length; i++) {\n        if (arr[i] > running) running = arr[i];\n        if (running === i) chunks++;\n    }\n    return chunks;\n}`,
              java: `public static int maxChunksToSorted(int[] arr) {\n    int chunks = 0, running = -1;\n    for (int i = 0; i < arr.length; i++) {\n        running = Math.max(running, arr[i]);\n        if (running == i) chunks++;\n    }\n    return chunks;\n}`,
              cpp: `int maxChunksToSorted(vector<int>& arr) {\n    int chunks = 0, running = -1;\n    for (int i = 0; i < (int) arr.size(); i++) {\n        running = max(running, arr[i]);\n        if (running == i) chunks++;\n    }\n    return chunks;\n}`,
              c: `int maxChunksToSorted(int* arr, int arrSize) {\n    int chunks = 0, running = -1;\n    for (int i = 0; i < arrSize; i++) {\n        if (arr[i] > running) running = arr[i];\n        if (running == i) chunks++;\n    }\n    return chunks;\n}`,
              csharp: `public static int MaxChunksToSorted(int[] arr)\n{\n    int chunks = 0, running = -1;\n    for (int i = 0; i < arr.Length; i++)\n    {\n        running = Math.Max(running, arr[i]);\n        if (running == i) chunks++;\n    }\n    return chunks;\n}`,
              go: `func maxChunksToSorted(arr []int) int {\n	chunks, running := 0, -1\n	for i := 0; i < len(arr); i++ {\n		if arr[i] > running {\n			running = arr[i]\n		}\n		if running == i {\n			chunks++\n		}\n	}\n	return chunks\n}`,
              kotlin: `fun maxChunksToSorted(arr: IntArray): Int {\n    var chunks = 0\n    var running = -1\n    for (i in arr.indices) {\n        if (arr[i] > running) running = arr[i]\n        if (running == i) chunks++\n    }\n    return chunks\n}`,
              swift: `func maxChunksToSorted(_ arr: [Int]) -> Int {\n    var chunks = 0\n    var running = -1\n    for i in 0..<arr.count {\n        if arr[i] > running { running = arr[i] }\n        if running == i { chunks += 1 }\n    }\n    return chunks\n}`,
              rust: `fn maxChunksToSorted(arr: Vec<i32>) -> i32 {\n    let mut chunks = 0;\n    let mut running = -1;\n    for i in 0..arr.len() {\n        if arr[i] > running {\n            running = arr[i];\n        }\n        if running == i as i32 {\n            chunks += 1;\n        }\n    }\n    chunks\n}`,
              php: `function maxChunksToSorted($arr) {\n    $chunks = 0;\n    $running = -1;\n    $n = count($arr);\n    for ($i = 0; $i < $n; $i++) {\n        if ($arr[$i] > $running) $running = $arr[$i];\n        if ($running === $i) $chunks++;\n    }\n    return $chunks;\n}`,
              ruby: `def maxChunksToSorted(arr)\n  chunks = 0\n  running = -1\n  arr.each_with_index do |x, i|\n    running = x if x > running\n    chunks += 1 if running == i\n  end\n  chunks\nend`,
      },
    };
  })(),

  // ── Number of Visible People in a Queue ─────────────────────────
  (() => {
    const ref = (heights: number[]) => {
      const n = heights.length;
      const out: number[] = [];
      for (let i = 0; i < n; i++) out.push(0);
      const stack: number[] = [];
      for (let i = n - 1; i >= 0; i--) {
        let seen = 0;
        while (stack.length > 0 && stack[stack.length - 1] < heights[i]) {
          stack.pop();
          seen++;
        }
        if (stack.length > 0) seen++;
        out[i] = seen;
        stack.push(heights[i]);
      }
      return out;
    };
    return {
      slug: "number-of-visible-people-in-a-queue",
      title: "Number of Visible People in a Queue",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Google"],
      signature: { funcName: "canSeePersonsCount", params: [{ name: "heights", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` people in a queue with **distinct** heights, all facing right. Person `i` can see person `j` (where `i < j`) if everyone strictly between them is shorter than **both** of them.\n\nReturn an array where the i-th entry is the number of people person `i` can see to their right.",
        [
          { in: "heights = [10,6,8,5,11,9]", out: "[3,1,2,1,1,0]" },
          { in: "heights = [5,1,2,3,10]", out: "[4,1,1,1,0]" },
          { in: "heights = [1]", out: "[0]" },
        ],
        ["1 <= heights.length <= 40", "1 <= heights[i] <= 1000000", "All heights are distinct."]),
      hints: [
        "Scan from the right, keeping a stack of heights that are increasing from top to bottom.",
        "Everyone the stack pops is visible — they are shorter than the current person and were the tallest so far.",
        "After popping, the remaining top (if any) is also visible, and it blocks everything beyond it.",
      ],
      examples: [
        { input: "[10,6,8,5,11,9]", expectedOutput: "[3,1,2,1,1,0]" },
        { input: "[5,1,2,3,10]", expectedOutput: "[4,1,1,1,0]" },
        { input: "[1]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const values = new Set<number>();
        while (values.size < n) values.add(ri(rng, 1, rng() < 0.5 ? 200 : 1000000));
        const heights = shuffle(rng, Array.from(values));
        return { input: fmtIntArr(heights), expectedOutput: fmtIntArr(ref(heights)) };
      },
      solutions: {
        python: `def canSeePersonsCount(heights):\n    n = len(heights)\n    out = [0] * n\n    stack = []\n    for i in range(n - 1, -1, -1):\n        seen = 0\n        while stack and stack[-1] < heights[i]:\n            stack.pop()\n            seen += 1\n        if stack:\n            seen += 1\n        out[i] = seen\n        stack.append(heights[i])\n    return out`,
        javascript: `var canSeePersonsCount = function(heights) {\n    const n = heights.length;\n    const out = [];\n    for (let i = 0; i < n; i++) out.push(0);\n    const stack = [];\n    for (let i = n - 1; i >= 0; i--) {\n        let seen = 0;\n        while (stack.length > 0 && stack[stack.length - 1] < heights[i]) {\n            stack.pop();\n            seen++;\n        }\n        if (stack.length > 0) seen++;\n        out[i] = seen;\n        stack.push(heights[i]);\n    }\n    return out;\n};`,
              typescript: `function canSeePersonsCount(heights: number[]): number[] {\n    var n = heights.length;\n    var out: number[] = [];\n    for (var i = 0; i < n; i++) out.push(0);\n    var stack: number[] = [];\n    for (var j = n - 1; j >= 0; j--) {\n        var seen = 0;\n        while (stack.length > 0 && stack[stack.length - 1] < heights[j]) {\n            stack.pop();\n            seen++;\n        }\n        if (stack.length > 0) seen++;\n        out[j] = seen;\n        stack.push(heights[j]);\n    }\n    return out;\n}`,
              java: `public static int[] canSeePersonsCount(int[] heights) {\n    int n = heights.length;\n    int[] out = new int[n];\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = n - 1; i >= 0; i--) {\n        int seen = 0;\n        while (!stack.isEmpty() && stack.peek() < heights[i]) {\n            stack.pop();\n            seen++;\n        }\n        if (!stack.isEmpty()) seen++;\n        out[i] = seen;\n        stack.push(heights[i]);\n    }\n    return out;\n}`,
              cpp: `vector<int> canSeePersonsCount(vector<int>& heights) {\n    int n = (int) heights.size();\n    vector<int> out(n, 0);\n    vector<int> stack;\n    for (int i = n - 1; i >= 0; i--) {\n        int seen = 0;\n        while (!stack.empty() && stack.back() < heights[i]) {\n            stack.pop_back();\n            seen++;\n        }\n        if (!stack.empty()) seen++;\n        out[i] = seen;\n        stack.push_back(heights[i]);\n    }\n    return out;\n}`,
              c: `int* canSeePersonsCount(int* heights, int heightsSize, int* returnSize) {\n    int n = heightsSize;\n    int* out = (int*) calloc((size_t) (n > 0 ? n : 1), sizeof(int));\n    int* stack = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        int seen = 0;\n        while (top > 0 && stack[top - 1] < heights[i]) {\n            top--;\n            seen++;\n        }\n        if (top > 0) seen++;\n        out[i] = seen;\n        stack[top++] = heights[i];\n    }\n    free(stack);\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static int[] CanSeePersonsCount(int[] heights)\n{\n    int n = heights.Length;\n    int[] out_ = new int[n];\n    var stack = new List<int>();\n    for (int i = n - 1; i >= 0; i--)\n    {\n        int seen = 0;\n        while (stack.Count > 0 && stack[stack.Count - 1] < heights[i])\n        {\n            stack.RemoveAt(stack.Count - 1);\n            seen++;\n        }\n        if (stack.Count > 0) seen++;\n        out_[i] = seen;\n        stack.Add(heights[i]);\n    }\n    return out_;\n}`,
              go: `func canSeePersonsCount(heights []int) []int {\n	n := len(heights)\n	out := make([]int, n)\n	stack := []int{}\n	for i := n - 1; i >= 0; i-- {\n		seen := 0\n		for len(stack) > 0 && stack[len(stack)-1] < heights[i] {\n			stack = stack[:len(stack)-1]\n			seen++\n		}\n		if len(stack) > 0 {\n			seen++\n		}\n		out[i] = seen\n		stack = append(stack, heights[i])\n	}\n	return out\n}`,
              kotlin: `fun canSeePersonsCount(heights: IntArray): IntArray {\n    val n = heights.size\n    val out = IntArray(n)\n    val stack = ArrayList<Int>()\n    for (i in n - 1 downTo 0) {\n        var seen = 0\n        while (stack.isNotEmpty() && stack[stack.size - 1] < heights[i]) {\n            stack.removeAt(stack.size - 1)\n            seen++\n        }\n        if (stack.isNotEmpty()) seen++\n        out[i] = seen\n        stack.add(heights[i])\n    }\n    return out\n}`,
              swift: `func canSeePersonsCount(_ heights: [Int]) -> [Int] {\n    let n = heights.count\n    var out = [Int](repeating: 0, count: n)\n    var stack: [Int] = []\n    var i = n - 1\n    while i >= 0 {\n        var seen = 0\n        while let top = stack.last, top < heights[i] {\n            stack.removeLast()\n            seen += 1\n        }\n        if !stack.isEmpty { seen += 1 }\n        out[i] = seen\n        stack.append(heights[i])\n        i -= 1\n    }\n    return out\n}`,
              rust: `fn canSeePersonsCount(heights: Vec<i32>) -> Vec<i32> {\n    let n = heights.len();\n    let mut out = vec![0i32; n];\n    let mut stack: Vec<i32> = Vec::new();\n    for i in (0..n).rev() {\n        let mut seen = 0;\n        while let Some(&top) = stack.last() {\n            if top < heights[i] {\n                stack.pop();\n                seen += 1;\n            } else {\n                break;\n            }\n        }\n        if !stack.is_empty() {\n            seen += 1;\n        }\n        out[i] = seen;\n        stack.push(heights[i]);\n    }\n    out\n}`,
              php: `function canSeePersonsCount($heights) {\n    $n = count($heights);\n    $out = array_fill(0, $n, 0);\n    $stack = array();\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $seen = 0;\n        while (count($stack) > 0 && $stack[count($stack) - 1] < $heights[$i]) {\n            array_pop($stack);\n            $seen++;\n        }\n        if (count($stack) > 0) $seen++;\n        $out[$i] = $seen;\n        $stack[] = $heights[$i];\n    }\n    return $out;\n}`,
              ruby: `def canSeePersonsCount(heights)\n  n = heights.length\n  out = Array.new(n, 0)\n  stack = []\n  (n - 1).downto(0) do |i|\n    seen = 0\n    while !stack.empty? && stack[-1] < heights[i]\n      stack.pop\n      seen += 1\n    end\n    seen += 1 unless stack.empty?\n    out[i] = seen\n    stack.push(heights[i])\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Remove All Occurrences of a Substring ───────────────────────
  (() => {
    const ref = (s: string, part: string) => {
      const stack: string[] = [];
      const m = part.length;
      for (let i = 0; i < s.length; i++) {
        stack.push(s[i]);
        if (stack.length >= m) {
          let match = true;
          for (let j = 0; j < m; j++) {
            if (stack[stack.length - m + j] !== part[j]) {
              match = false;
              break;
            }
          }
          if (match) stack.length -= m;
        }
      }
      return stack.join("");
    };
    return {
      slug: "remove-all-occurrences-of-a-substring",
      title: "Remove All Occurrences of a Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "removeOccurrences", params: [{ name: "s", type: "string" as const }, { name: "part", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given two strings `s` and `part`, repeatedly remove the **leftmost** occurrence of `part` from `s` until `s` no longer contains it, then return `s`.",
        [
          { in: 's = "daabcbaabcbc", part = "abc"', out: "dab" },
          { in: 's = "axxxxyyyyb", part = "xy"', out: "ab" },
          { in: 's = "abc", part = "d"', out: "abc" },
        ],
        ["1 <= s.length <= 40", "1 <= part.length <= 4", "Both consist of lowercase English letters."]),
      hints: [
        "Push characters onto a stack one at a time.",
        "After each push, check whether the top `part.length` characters spell `part`.",
        "If they do, pop them off — this handles matches that only appear after an earlier removal.",
      ],
      examples: [
        { input: '"daabcbaabcbc"\n"abc"', expectedOutput: "dab" },
        { input: '"axxxxyyyyb"\n"xy"', expectedOutput: "ab" },
        { input: '"abc"\n"d"', expectedOutput: "abc" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.7 ? "abc" : "abcd";
        const s = randStr(rng, 1, 40, alphabet);
        const part = randStr(rng, 1, 4, alphabet);
        return { input: `"${s}"\n"${part}"`, expectedOutput: ref(s, part) };
      },
      solutions: {
        python: `def removeOccurrences(s: str, part: str) -> str:\n    stack = []\n    m = len(part)\n    for ch in s:\n        stack.append(ch)\n        if len(stack) >= m and "".join(stack[-m:]) == part:\n            del stack[-m:]\n    return "".join(stack)`,
        javascript: `var removeOccurrences = function(s, part) {\n    const stack = [];\n    const m = part.length;\n    for (let i = 0; i < s.length; i++) {\n        stack.push(s.charAt(i));\n        if (stack.length >= m) {\n            let match = true;\n            for (let j = 0; j < m; j++) {\n                if (stack[stack.length - m + j] !== part.charAt(j)) {\n                    match = false;\n                    break;\n                }\n            }\n            if (match) stack.length -= m;\n        }\n    }\n    return stack.join("");\n};`,
              typescript: `function removeOccurrences(s: string, part: string): string {\n    var stack: string[] = [];\n    var m = part.length;\n    for (var i = 0; i < s.length; i++) {\n        stack.push(s.charAt(i));\n        if (stack.length >= m) {\n            var match = true;\n            for (var j = 0; j < m; j++) {\n                if (stack[stack.length - m + j] !== part.charAt(j)) {\n                    match = false;\n                    break;\n                }\n            }\n            if (match) stack.length -= m;\n        }\n    }\n    return stack.join("");\n}`,
              java: `public static String removeOccurrences(String s, String part) {\n    StringBuilder stack = new StringBuilder();\n    int m = part.length();\n    for (int i = 0; i < s.length(); i++) {\n        stack.append(s.charAt(i));\n        if (stack.length() >= m) {\n            boolean match = true;\n            for (int j = 0; j < m; j++) {\n                if (stack.charAt(stack.length() - m + j) != part.charAt(j)) {\n                    match = false;\n                    break;\n                }\n            }\n            if (match) stack.setLength(stack.length() - m);\n        }\n    }\n    return stack.toString();\n}`,
              cpp: `string removeOccurrences(string s, string part) {\n    string stk;\n    int m = (int) part.size();\n    for (char c : s) {\n        stk.push_back(c);\n        if ((int) stk.size() >= m && stk.compare(stk.size() - m, m, part) == 0) {\n            stk.erase(stk.size() - m);\n        }\n    }\n    return stk;\n}`,
              c: `char* removeOccurrences(const char* s, const char* part) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(part);\n    char* stack = (char*) malloc((size_t) n + 2);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        stack[top++] = s[i];\n        if (top >= m) {\n            int match = 1;\n            for (int j = 0; j < m; j++) {\n                if (stack[top - m + j] != part[j]) {\n                    match = 0;\n                    break;\n                }\n            }\n            if (match) top -= m;\n        }\n    }\n    stack[top] = '\\0';\n    return stack;\n}`,
              csharp: `public static string RemoveOccurrences(string s, string part)\n{\n    var stack = new List<char>();\n    int m = part.Length;\n    foreach (char c in s)\n    {\n        stack.Add(c);\n        if (stack.Count >= m)\n        {\n            bool match = true;\n            for (int j = 0; j < m; j++)\n            {\n                if (stack[stack.Count - m + j] != part[j])\n                {\n                    match = false;\n                    break;\n                }\n            }\n            if (match) stack.RemoveRange(stack.Count - m, m);\n        }\n    }\n    return new string(stack.ToArray());\n}`,
              go: `func removeOccurrences(s string, part string) string {\n	stack := []byte{}\n	m := len(part)\n	for i := 0; i < len(s); i++ {\n		stack = append(stack, s[i])\n		if len(stack) >= m {\n			match := true\n			for j := 0; j < m; j++ {\n				if stack[len(stack)-m+j] != part[j] {\n					match = false\n					break\n				}\n			}\n			if match {\n				stack = stack[:len(stack)-m]\n			}\n		}\n	}\n	return string(stack)\n}`,
              kotlin: `fun removeOccurrences(s: String, part: String): String {\n    val stack = StringBuilder()\n    val m = part.length\n    for (c in s) {\n        stack.append(c)\n        if (stack.length >= m) {\n            var match = true\n            for (j in 0 until m) {\n                if (stack[stack.length - m + j] != part[j]) {\n                    match = false\n                    break\n                }\n            }\n            if (match) stack.setLength(stack.length - m)\n        }\n    }\n    return stack.toString()\n}`,
              swift: `func removeOccurrences(_ s: String, _ part: String) -> String {\n    let partChars = Array(part)\n    let m = partChars.count\n    var stack: [Character] = []\n    for c in s {\n        stack.append(c)\n        if stack.count >= m {\n            var match = true\n            for j in 0..<m {\n                if stack[stack.count - m + j] != partChars[j] {\n                    match = false\n                    break\n                }\n            }\n            if match { stack.removeLast(m) }\n        }\n    }\n    return String(stack)\n}`,
              rust: `fn removeOccurrences(s: String, part: String) -> String {\n    let part_bytes: Vec<u8> = part.bytes().collect();\n    let m = part_bytes.len();\n    let mut stack: Vec<u8> = Vec::new();\n    for c in s.bytes() {\n        stack.push(c);\n        if stack.len() >= m {\n            let mut matched = true;\n            for j in 0..m {\n                if stack[stack.len() - m + j] != part_bytes[j] {\n                    matched = false;\n                    break;\n                }\n            }\n            if matched {\n                let keep = stack.len() - m;\n                stack.truncate(keep);\n            }\n        }\n    }\n    String::from_utf8(stack).unwrap()\n}`,
              php: `function removeOccurrences($s, $part) {\n    $stack = array();\n    $m = strlen($part);\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $stack[] = $s[$i];\n        if (count($stack) >= $m) {\n            $match = true;\n            for ($j = 0; $j < $m; $j++) {\n                if ($stack[count($stack) - $m + $j] !== $part[$j]) {\n                    $match = false;\n                    break;\n                }\n            }\n            if ($match) $stack = array_slice($stack, 0, count($stack) - $m);\n        }\n    }\n    return implode("", $stack);\n}`,
              ruby: `def removeOccurrences(s, part)\n  stack = []\n  m = part.length\n  s.each_char do |c|\n    stack.push(c)\n    if stack.length >= m && stack[-m..-1].join == part\n      stack.pop(m)\n    end\n  end\n  stack.join\nend`,
      },
    };
  })(),

  // ── Minimum Number of Swaps to Make the String Balanced ─────────
  (() => {
    const ref = (s: string) => {
      let unmatched = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "[") unmatched++;
        else if (unmatched > 0) unmatched--;
      }
      return Math.floor((unmatched + 1) / 2);
    };
    return {
      slug: "minimum-number-of-swaps-to-make-the-string-balanced",
      title: "Minimum Number of Swaps to Make the String Balanced",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Two Pointers", "Amazon", "Google"],
      signature: { funcName: "minSwaps", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of even length containing exactly `n/2` opening brackets `'['` and `n/2` closing brackets `']'`.\n\nIn one move you may swap any two characters. Return the minimum number of swaps needed to make the string **balanced**.",
        [
          { in: 's = "][]["', out: "1" },
          { in: 's = "]]][[["', out: "2" },
          { in: 's = "[]"', out: "0" },
        ],
        ["2 <= s.length <= 40", "s.length is even.", "s contains equally many '[' and ']'."]),
      hints: [
        "Cancel matched pairs as you scan; what remains is a block of `]` followed by a block of `[`, of equal size.",
        "One well-chosen swap fixes **two** of the unmatched pairs at once.",
        "So the answer is the number of unmatched pairs, rounded up after halving.",
      ],
      examples: [
        { input: '"][]["', expectedOutput: "1" },
        { input: '"]]][[["', expectedOutput: "2" },
        { input: '"[]"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const half = ri(rng, 1, 20);
        const chars: string[] = [];
        for (let i = 0; i < half; i++) chars.push("[");
        for (let i = 0; i < half; i++) chars.push("]");
        const s = shuffle(rng, chars).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minSwaps(s: str) -> int:\n    unmatched = 0\n    for ch in s:\n        if ch == "[":\n            unmatched += 1\n        elif unmatched > 0:\n            unmatched -= 1\n    return (unmatched + 1) // 2`,
        javascript: `var minSwaps = function(s) {\n    let unmatched = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "[") unmatched++;\n        else if (unmatched > 0) unmatched--;\n    }\n    return Math.floor((unmatched + 1) / 2);\n};`,
              typescript: `function minSwaps(s: string): number {\n    var unmatched = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "[") unmatched++;\n        else if (unmatched > 0) unmatched--;\n    }\n    return Math.floor((unmatched + 1) / 2);\n}`,
              java: `public static int minSwaps(String s) {\n    int unmatched = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '[') unmatched++;\n        else if (unmatched > 0) unmatched--;\n    }\n    return (unmatched + 1) / 2;\n}`,
              cpp: `int minSwaps(string s) {\n    int unmatched = 0;\n    for (char c : s) {\n        if (c == '[') unmatched++;\n        else if (unmatched > 0) unmatched--;\n    }\n    return (unmatched + 1) / 2;\n}`,
              c: `int minSwaps(const char* s) {\n    int unmatched = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == '[') unmatched++;\n        else if (unmatched > 0) unmatched--;\n    }\n    return (unmatched + 1) / 2;\n}`,
              csharp: `public static int MinSwaps(string s)\n{\n    int unmatched = 0;\n    foreach (char c in s)\n    {\n        if (c == '[') unmatched++;\n        else if (unmatched > 0) unmatched--;\n    }\n    return (unmatched + 1) / 2;\n}`,
              go: `func minSwaps(s string) int {\n	unmatched := 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '[' {\n			unmatched++\n		} else if unmatched > 0 {\n			unmatched--\n		}\n	}\n	return (unmatched + 1) / 2\n}`,
              kotlin: `fun minSwaps(s: String): Int {\n    var unmatched = 0\n    for (c in s) {\n        if (c == '[') unmatched++\n        else if (unmatched > 0) unmatched--\n    }\n    return (unmatched + 1) / 2\n}`,
              swift: `func minSwaps(_ s: String) -> Int {\n    var unmatched = 0\n    for c in s {\n        if c == "[" { unmatched += 1 }\n        else if unmatched > 0 { unmatched -= 1 }\n    }\n    return (unmatched + 1) / 2\n}`,
              rust: `fn minSwaps(s: String) -> i32 {\n    let mut unmatched = 0;\n    for c in s.bytes() {\n        if c == b'[' {\n            unmatched += 1;\n        } else if unmatched > 0 {\n            unmatched -= 1;\n        }\n    }\n    (unmatched + 1) / 2\n}`,
              php: `function minSwaps($s) {\n    $unmatched = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "[") $unmatched++;\n        else if ($unmatched > 0) $unmatched--;\n    }\n    return intdiv($unmatched + 1, 2);\n}`,
              ruby: `def minSwaps(s)\n  unmatched = 0\n  s.each_char do |c|\n    if c == "["\n      unmatched += 1\n    elsif unmatched > 0\n      unmatched -= 1\n    end\n  end\n  (unmatched + 1) / 2\nend`,
      },
    };
  })(),

  // ── Maximum Score From Removing Substrings ──────────────────────
  (() => {
    const ref = (s: string, x: number, y: number) => {
      const first = x >= y ? "ab" : "ba";
      const second = x >= y ? "ba" : "ab";
      const firstScore = Math.max(x, y);
      const secondScore = Math.min(x, y);
      let total = 0;
      const sweep = (input: string, pair: string, score: number) => {
        const stack: string[] = [];
        for (let i = 0; i < input.length; i++) {
          if (stack.length > 0 && stack[stack.length - 1] === pair[0] && input[i] === pair[1]) {
            stack.pop();
            total += score;
          } else {
            stack.push(input[i]);
          }
        }
        return stack.join("");
      };
      const rest = sweep(s, first, firstScore);
      sweep(rest, second, secondScore);
      return total;
    };
    return {
      slug: "maximum-score-from-removing-substrings",
      title: "Maximum Score From Removing Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Amazon", "Google"],
      signature: { funcName: "maximumGain", params: [{ name: "s", type: "string" as const }, { name: "x", type: "int" as const }, { name: "y", type: "int" as const }], returns: "int" as const },
      description: describe(
        'You are given a string `s` and two integers `x` and `y`. You may repeatedly:\n\n- remove the substring `"ab"` and gain `x` points, or\n- remove the substring `"ba"` and gain `y` points.\n\nReturn the maximum total score obtainable.',
        [
          { in: 's = "cdbcbbaaabab", x = 4, y = 5', out: "19" },
          { in: 's = "aabbaaxybbaabb", x = 5, y = 4', out: "20" },
          { in: 's = "ab", x = 1, y = 10', out: "1" },
        ],
        ["1 <= s.length <= 40", "1 <= x, y <= 10000", "s consists of lowercase English letters."]),
      hints: [
        "Removing the higher-scoring pair first is never worse — any `ab` and `ba` that compete for the same letters can be reordered without loss.",
        "So sweep once with a stack removing the better pair, then sweep the leftover string removing the other.",
        "Letters that are neither `a` nor `b` simply block matches and stay on the stack.",
      ],
      examples: [
        { input: '"cdbcbbaaabab"\n4\n5', expectedOutput: "19" },
        { input: '"aabbaaxybbaabb"\n5\n4', expectedOutput: "20" },
        { input: '"ab"\n1\n10', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.7 ? "ababc" : "abcde";
        const s = randStr(rng, 1, 40, alphabet);
        const x = ri(rng, 1, 10000);
        const y = ri(rng, 1, 10000);
        return { input: `"${s}"\n${x}\n${y}`, expectedOutput: String(ref(s, x, y)) };
      },
      solutions: {
        python: `def maximumGain(s: str, x: int, y: int) -> int:\n    first = "ab" if x >= y else "ba"\n    second = "ba" if x >= y else "ab"\n    total = 0\n\n    def sweep(text, pair, score):\n        nonlocal total\n        stack = []\n        for ch in text:\n            if stack and stack[-1] == pair[0] and ch == pair[1]:\n                stack.pop()\n                total += score\n            else:\n                stack.append(ch)\n        return "".join(stack)\n\n    rest = sweep(s, first, max(x, y))\n    sweep(rest, second, min(x, y))\n    return total`,
        javascript: `var maximumGain = function(s, x, y) {\n    const first = x >= y ? "ab" : "ba";\n    const second = x >= y ? "ba" : "ab";\n    let total = 0;\n    const sweep = function(input, pair, score) {\n        const stack = [];\n        for (let i = 0; i < input.length; i++) {\n            if (stack.length > 0 && stack[stack.length - 1] === pair.charAt(0) && input.charAt(i) === pair.charAt(1)) {\n                stack.pop();\n                total += score;\n            } else {\n                stack.push(input.charAt(i));\n            }\n        }\n        return stack.join("");\n    };\n    const rest = sweep(s, first, Math.max(x, y));\n    sweep(rest, second, Math.min(x, y));\n    return total;\n};`,
              typescript: `function gainSweep(text: string, first: string, second: string, score: number, out: number[]): string {\n    var stack: string[] = [];\n    for (var i = 0; i < text.length; i++) {\n        var c = text.charAt(i);\n        if (stack.length > 0 && stack[stack.length - 1] === first && c === second) {\n            stack.pop();\n            out[0] += score;\n        } else {\n            stack.push(c);\n        }\n    }\n    return stack.join("");\n}\n\nfunction maximumGain(s: string, x: number, y: number): number {\n    var out = [0];\n    var rest: string;\n    if (x >= y) {\n        rest = gainSweep(s, "a", "b", x, out);\n        gainSweep(rest, "b", "a", y, out);\n    } else {\n        rest = gainSweep(s, "b", "a", y, out);\n        gainSweep(rest, "a", "b", x, out);\n    }\n    return out[0];\n}`,
              java: `private static int gainTotal;\n\nprivate static String gainSweep(String text, char first, char second, int score) {\n    StringBuilder stack = new StringBuilder();\n    for (int i = 0; i < text.length(); i++) {\n        char c = text.charAt(i);\n        if (stack.length() > 0 && stack.charAt(stack.length() - 1) == first && c == second) {\n            stack.deleteCharAt(stack.length() - 1);\n            gainTotal += score;\n        } else {\n            stack.append(c);\n        }\n    }\n    return stack.toString();\n}\n\npublic static int maximumGain(String s, int x, int y) {\n    gainTotal = 0;\n    if (x >= y) {\n        String rest = gainSweep(s, 'a', 'b', x);\n        gainSweep(rest, 'b', 'a', y);\n    } else {\n        String rest = gainSweep(s, 'b', 'a', y);\n        gainSweep(rest, 'a', 'b', x);\n    }\n    return gainTotal;\n}`,
              cpp: `static int gainTotal;\n\nstatic string gainSweep(const string& text, char first, char second, int score) {\n    string stk;\n    for (char c : text) {\n        if (!stk.empty() && stk.back() == first && c == second) {\n            stk.pop_back();\n            gainTotal += score;\n        } else {\n            stk.push_back(c);\n        }\n    }\n    return stk;\n}\n\nint maximumGain(string s, int x, int y) {\n    gainTotal = 0;\n    if (x >= y) {\n        string rest = gainSweep(s, 'a', 'b', x);\n        gainSweep(rest, 'b', 'a', y);\n    } else {\n        string rest = gainSweep(s, 'b', 'a', y);\n        gainSweep(rest, 'a', 'b', x);\n    }\n    return gainTotal;\n}`,
              c: `static int gainSweepC(char* text, char first, char second, int score, int* total) {\n    int len = 0;\n    for (int i = 0; text[i] != '\\0'; i++) {\n        char c = text[i];\n        if (len > 0 && text[len - 1] == first && c == second) {\n            len--;\n            *total += score;\n        } else {\n            text[len++] = c;\n        }\n    }\n    text[len] = '\\0';\n    return len;\n}\n\nint maximumGain(const char* s, int x, int y) {\n    int n = (int) strlen(s);\n    char* buf = (char*) malloc((size_t) n + 2);\n    strcpy(buf, s);\n    int total = 0;\n    if (x >= y) {\n        gainSweepC(buf, 'a', 'b', x, &total);\n        gainSweepC(buf, 'b', 'a', y, &total);\n    } else {\n        gainSweepC(buf, 'b', 'a', y, &total);\n        gainSweepC(buf, 'a', 'b', x, &total);\n    }\n    free(buf);\n    return total;\n}`,
              csharp: `private static int gainTotal;\n\nprivate static string GainSweep(string text, char first, char second, int score)\n{\n    var stack = new List<char>();\n    foreach (char c in text)\n    {\n        if (stack.Count > 0 && stack[stack.Count - 1] == first && c == second)\n        {\n            stack.RemoveAt(stack.Count - 1);\n            gainTotal += score;\n        }\n        else\n        {\n            stack.Add(c);\n        }\n    }\n    return new string(stack.ToArray());\n}\n\npublic static int MaximumGain(string s, int x, int y)\n{\n    gainTotal = 0;\n    if (x >= y)\n    {\n        string rest = GainSweep(s, 'a', 'b', x);\n        GainSweep(rest, 'b', 'a', y);\n    }\n    else\n    {\n        string rest = GainSweep(s, 'b', 'a', y);\n        GainSweep(rest, 'a', 'b', x);\n    }\n    return gainTotal;\n}`,
              go: `func gainSweep(text string, first byte, second byte, score int, total *int) string {\n	stack := []byte{}\n	for i := 0; i < len(text); i++ {\n		c := text[i]\n		if len(stack) > 0 && stack[len(stack)-1] == first && c == second {\n			stack = stack[:len(stack)-1]\n			*total += score\n		} else {\n			stack = append(stack, c)\n		}\n	}\n	return string(stack)\n}\n\nfunc maximumGain(s string, x int, y int) int {\n	total := 0\n	if x >= y {\n		rest := gainSweep(s, 'a', 'b', x, &total)\n		gainSweep(rest, 'b', 'a', y, &total)\n	} else {\n		rest := gainSweep(s, 'b', 'a', y, &total)\n		gainSweep(rest, 'a', 'b', x, &total)\n	}\n	return total\n}`,
              kotlin: `fun gainSweep(text: String, first: Char, second: Char, score: Int, total: IntArray): String {\n    val stack = StringBuilder()\n    for (c in text) {\n        if (stack.isNotEmpty() && stack[stack.length - 1] == first && c == second) {\n            stack.deleteCharAt(stack.length - 1)\n            total[0] += score\n        } else {\n            stack.append(c)\n        }\n    }\n    return stack.toString()\n}\n\nfun maximumGain(s: String, x: Int, y: Int): Int {\n    val total = IntArray(1)\n    if (x >= y) {\n        val rest = gainSweep(s, 'a', 'b', x, total)\n        gainSweep(rest, 'b', 'a', y, total)\n    } else {\n        val rest = gainSweep(s, 'b', 'a', y, total)\n        gainSweep(rest, 'a', 'b', x, total)\n    }\n    return total[0]\n}`,
              swift: `func gainSweep(_ text: [Character], _ first: Character, _ second: Character, _ score: Int, _ total: inout Int) -> [Character] {\n    var stack: [Character] = []\n    for c in text {\n        if let top = stack.last, top == first, c == second {\n            stack.removeLast()\n            total += score\n        } else {\n            stack.append(c)\n        }\n    }\n    return stack\n}\n\nfunc maximumGain(_ s: String, _ x: Int, _ y: Int) -> Int {\n    var total = 0\n    let chars = Array(s)\n    if x >= y {\n        let rest = gainSweep(chars, "a", "b", x, &total)\n        _ = gainSweep(rest, "b", "a", y, &total)\n    } else {\n        let rest = gainSweep(chars, "b", "a", y, &total)\n        _ = gainSweep(rest, "a", "b", x, &total)\n    }\n    return total\n}`,
              rust: `fn gain_sweep(text: &Vec<u8>, first: u8, second: u8, score: i32, total: &mut i32) -> Vec<u8> {\n    let mut stack: Vec<u8> = Vec::new();\n    for c in text.iter() {\n        if !stack.is_empty() && stack[stack.len() - 1] == first && *c == second {\n            stack.pop();\n            *total += score;\n        } else {\n            stack.push(*c);\n        }\n    }\n    stack\n}\n\nfn maximumGain(s: String, x: i32, y: i32) -> i32 {\n    let chars: Vec<u8> = s.bytes().collect();\n    let mut total = 0;\n    if x >= y {\n        let rest = gain_sweep(&chars, b'a', b'b', x, &mut total);\n        gain_sweep(&rest, b'b', b'a', y, &mut total);\n    } else {\n        let rest = gain_sweep(&chars, b'b', b'a', y, &mut total);\n        gain_sweep(&rest, b'a', b'b', x, &mut total);\n    }\n    total\n}`,
              php: `function gainSweep($text, $first, $second, $score, &$total) {\n    $stack = array();\n    $n = strlen($text);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $text[$i];\n        if (count($stack) > 0 && $stack[count($stack) - 1] === $first && $c === $second) {\n            array_pop($stack);\n            $total += $score;\n        } else {\n            $stack[] = $c;\n        }\n    }\n    return implode("", $stack);\n}\n\nfunction maximumGain($s, $x, $y) {\n    $total = 0;\n    if ($x >= $y) {\n        $rest = gainSweep($s, "a", "b", $x, $total);\n        gainSweep($rest, "b", "a", $y, $total);\n    } else {\n        $rest = gainSweep($s, "b", "a", $y, $total);\n        gainSweep($rest, "a", "b", $x, $total);\n    }\n    return $total;\n}`,
              ruby: `def gain_sweep(text, first, second, score, total)\n  stack = []\n  text.each_char do |c|\n    if !stack.empty? && stack[-1] == first && c == second\n      stack.pop\n      total[0] += score\n    else\n      stack.push(c)\n    end\n  end\n  stack.join\nend\n\ndef maximumGain(s, x, y)\n  total = [0]\n  if x >= y\n    rest = gain_sweep(s, "a", "b", x, total)\n    gain_sweep(rest, "b", "a", y, total)\n  else\n    rest = gain_sweep(s, "b", "a", y, total)\n    gain_sweep(rest, "a", "b", x, total)\n  end\n  total[0]\nend`,
      },
    };
  })(),

  // ── The Number of Weak Characters in the Game ───────────────────
  (() => {
    const ref = (properties: number[][]) => {
      const sorted = properties.slice().sort((a, b) => (a[0] !== b[0] ? b[0] - a[0] : a[1] - b[1]));
      let maxDefense = 0, weak = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i][1] < maxDefense) weak++;
        else maxDefense = sorted[i][1];
      }
      return weak;
    };
    return {
      slug: "the-number-of-weak-characters-in-the-game",
      title: "The Number of Weak Characters in the Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Stack", "Monotonic Stack", "Amazon", "Google"],
      signature: { funcName: "numberOfWeakCharacters", params: [{ name: "properties", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are playing a game with characters, where `properties[i] = [attack, defense]`.\n\nA character is **weak** if some other character has **strictly greater** attack **and** strictly greater defense. Return the number of weak characters.",
        [
          { in: "properties = [[5,5],[6,3],[3,6]]", out: "0" },
          { in: "properties = [[2,2],[3,3]]", out: "1" },
          { in: "properties = [[1,5],[10,4],[4,3]]", out: "1" },
        ],
        ["2 <= properties.length <= 40", "1 <= attack, defense <= 100000"]),
      hints: [
        "Sort by attack **descending**, breaking ties by defense **ascending**.",
        "That tie-break guarantees equal-attack characters never count each other as weak.",
        "Then sweep once, tracking the largest defense seen so far; anything below it is weak.",
      ],
      examples: [
        { input: "[[5,5],[6,3],[3,6]]", expectedOutput: "0" },
        { input: "[[2,2],[3,3]]", expectedOutput: "1" },
        { input: "[[1,5],[10,4],[4,3]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 10 : 100000;
        const properties = Array.from({ length: ri(rng, 2, 40) }, () => [ri(rng, 1, hi), ri(rng, 1, hi)]);
        return { input: fmtIntMat(properties), expectedOutput: String(ref(properties)) };
      },
      solutions: {
        python: `def numberOfWeakCharacters(properties) -> int:\n    ordered = sorted(properties, key=lambda p: (-p[0], p[1]))\n    max_defense = 0\n    weak = 0\n    for _, defense in ordered:\n        if defense < max_defense:\n            weak += 1\n        else:\n            max_defense = defense\n    return weak`,
        javascript: `var numberOfWeakCharacters = function(properties) {\n    const sorted = properties.slice().sort(function(a, b) {\n        return a[0] !== b[0] ? b[0] - a[0] : a[1] - b[1];\n    });\n    let maxDefense = 0, weak = 0;\n    for (let i = 0; i < sorted.length; i++) {\n        if (sorted[i][1] < maxDefense) weak++;\n        else maxDefense = sorted[i][1];\n    }\n    return weak;\n};`,
              typescript: `function numberOfWeakCharacters(properties: number[][]): number {\n    var sorted = properties.slice().sort(function (a, b) {\n        return a[0] !== b[0] ? b[0] - a[0] : a[1] - b[1];\n    });\n    var maxDefense = 0;\n    var weak = 0;\n    for (var i = 0; i < sorted.length; i++) {\n        if (sorted[i][1] < maxDefense) weak++;\n        else maxDefense = sorted[i][1];\n    }\n    return weak;\n}`,
              java: `public static int numberOfWeakCharacters(int[][] properties) {\n    int[][] s = properties.clone();\n    Arrays.sort(s, (a, b) -> a[0] != b[0] ? b[0] - a[0] : a[1] - b[1]);\n    int maxDefense = 0, weak = 0;\n    for (int[] p : s) {\n        if (p[1] < maxDefense) weak++;\n        else maxDefense = p[1];\n    }\n    return weak;\n}`,
              cpp: `int numberOfWeakCharacters(vector<vector<int>>& properties) {\n    vector<vector<int>> s = properties;\n    sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b) {\n        if (a[0] != b[0]) return a[0] > b[0];\n        return a[1] < b[1];\n    });\n    int maxDefense = 0, weak = 0;\n    for (const auto& p : s) {\n        if (p[1] < maxDefense) weak++;\n        else maxDefense = p[1];\n    }\n    return weak;\n}`,
              c: `static int cmpWeakChar(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    if (x[0] != y[0]) return (y[0] > x[0]) - (y[0] < x[0]);\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint numberOfWeakCharacters(int** properties, int propertiesSize, int* propertiesColSize) {\n    int** s = (int**) malloc((size_t) (propertiesSize > 0 ? propertiesSize : 1) * sizeof(int*));\n    for (int i = 0; i < propertiesSize; i++) s[i] = properties[i];\n    qsort(s, propertiesSize, sizeof(int*), cmpWeakChar);\n    int maxDefense = 0, weak = 0;\n    for (int i = 0; i < propertiesSize; i++) {\n        if (s[i][1] < maxDefense) weak++;\n        else maxDefense = s[i][1];\n    }\n    free(s);\n    return weak;\n}`,
              csharp: `public static int NumberOfWeakCharacters(int[][] properties)\n{\n    var s = new List<int[]>(properties);\n    s.Sort((a, b) => a[0] != b[0] ? b[0].CompareTo(a[0]) : a[1].CompareTo(b[1]));\n    int maxDefense = 0, weak = 0;\n    foreach (int[] p in s)\n    {\n        if (p[1] < maxDefense) weak++;\n        else maxDefense = p[1];\n    }\n    return weak;\n}`,
              go: `func numberOfWeakCharacters(properties [][]int) int {\n	s := append([][]int{}, properties...)\n	sort.Slice(s, func(a, b int) bool {\n		if s[a][0] != s[b][0] {\n			return s[a][0] > s[b][0]\n		}\n		return s[a][1] < s[b][1]\n	})\n	maxDefense, weak := 0, 0\n	for _, p := range s {\n		if p[1] < maxDefense {\n			weak++\n		} else {\n			maxDefense = p[1]\n		}\n	}\n	return weak\n}`,
              kotlin: `fun numberOfWeakCharacters(properties: Array<IntArray>): Int {\n    val s = properties.sortedWith(compareByDescending<IntArray> { it[0] }.thenBy { it[1] })\n    var maxDefense = 0\n    var weak = 0\n    for (p in s) {\n        if (p[1] < maxDefense) weak++ else maxDefense = p[1]\n    }\n    return weak\n}`,
              swift: `func numberOfWeakCharacters(_ properties: [[Int]]) -> Int {\n    let s = properties.sorted { a, b in\n        if a[0] != b[0] { return a[0] > b[0] }\n        return a[1] < b[1]\n    }\n    var maxDefense = 0\n    var weak = 0\n    for p in s {\n        if p[1] < maxDefense { weak += 1 } else { maxDefense = p[1] }\n    }\n    return weak\n}`,
              rust: `fn numberOfWeakCharacters(properties: Vec<Vec<i32>>) -> i32 {\n    let mut s = properties.clone();\n    s.sort_by(|a, b| {\n        if a[0] != b[0] {\n            b[0].cmp(&a[0])\n        } else {\n            a[1].cmp(&b[1])\n        }\n    });\n    let mut max_defense = 0;\n    let mut weak = 0;\n    for p in s.iter() {\n        if p[1] < max_defense {\n            weak += 1;\n        } else {\n            max_defense = p[1];\n        }\n    }\n    weak\n}`,
              php: `function numberOfWeakCharacters($properties) {\n    $s = $properties;\n    usort($s, function($a, $b) {\n        if ($a[0] != $b[0]) return $b[0] - $a[0];\n        return $a[1] - $b[1];\n    });\n    $maxDefense = 0;\n    $weak = 0;\n    foreach ($s as $p) {\n        if ($p[1] < $maxDefense) $weak++;\n        else $maxDefense = $p[1];\n    }\n    return $weak;\n}`,
              ruby: `def numberOfWeakCharacters(properties)\n  s = properties.sort_by { |p| [-p[0], p[1]] }\n  max_defense = 0\n  weak = 0\n  s.each do |p|\n    if p[1] < max_defense\n      weak += 1\n    else\n      max_defense = p[1]\n    end\n  end\n  weak\nend`,
      },
    };
  })(),

  // ── Remove All Adjacent Duplicates in String II ─────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const chars: string[] = [];
      const counts: number[] = [];
      for (let i = 0; i < s.length; i++) {
        if (chars.length > 0 && chars[chars.length - 1] === s[i]) {
          counts[counts.length - 1]++;
        } else {
          chars.push(s[i]);
          counts.push(1);
        }
        if (counts[counts.length - 1] === k) {
          chars.pop();
          counts.pop();
        }
      }
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        for (let j = 0; j < counts[i]; j++) out += chars[i];
      }
      return out;
    };
    return {
      slug: "remove-all-adjacent-duplicates-in-string-ii",
      title: "Remove All Adjacent Duplicates in String II",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "removeDuplicates", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` and an integer `k`. A **k-duplicate removal** deletes `k` adjacent and equal characters from `s`, joining what is left.\n\nRepeat the removal until it is no longer possible and return the final string. The answer is unique.",
        [
          { in: 's = "abcd", k = 2', out: "abcd", note: "Nothing to remove." },
          { in: 's = "deeedbbcccbdaa", k = 3', out: "aa" },
          { in: 's = "pbbcggttciiippooaais", k = 2', out: "ps" },
        ],
        ["1 <= s.length <= 40", "2 <= k <= 6", "s consists of lowercase English letters."]),
      hints: [
        "Deleting characters can make new runs adjacent, so a single scan with a stack is the clean approach.",
        "Store pairs of (character, run length) on the stack instead of individual characters.",
        "When a run length hits `k`, pop the whole frame — the frames below then become adjacent automatically.",
      ],
      examples: [
        { input: '"abcd"\n2', expectedOutput: "abcd" },
        { input: '"deeedbbcccbdaa"\n3', expectedOutput: "aa" },
        { input: '"pbbcggttciiippooaais"\n2', expectedOutput: "ps" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.7 ? "abc" : "abcde");
        const k = ri(rng, 2, 6);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: `def removeDuplicates(s: str, k: int) -> str:\n    stack = []\n    for ch in s:\n        if stack and stack[-1][0] == ch:\n            stack[-1][1] += 1\n        else:\n            stack.append([ch, 1])\n        if stack[-1][1] == k:\n            stack.pop()\n    return "".join(ch * count for ch, count in stack)`,
        javascript: `var removeDuplicates = function(s, k) {\n    const chars = [], counts = [];\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (chars.length > 0 && chars[chars.length - 1] === c) {\n            counts[counts.length - 1]++;\n        } else {\n            chars.push(c);\n            counts.push(1);\n        }\n        if (counts[counts.length - 1] === k) {\n            chars.pop();\n            counts.pop();\n        }\n    }\n    let out = "";\n    for (let i = 0; i < chars.length; i++) {\n        for (let j = 0; j < counts[i]; j++) out += chars[i];\n    }\n    return out;\n};`,
              typescript: `function removeDuplicates(s: string, k: number): string {\n    var chars: string[] = [];\n    var counts: number[] = [];\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (chars.length > 0 && chars[chars.length - 1] === c) {\n            counts[counts.length - 1]++;\n        } else {\n            chars.push(c);\n            counts.push(1);\n        }\n        if (counts[counts.length - 1] === k) {\n            chars.pop();\n            counts.pop();\n        }\n    }\n    var out = "";\n    for (var j = 0; j < chars.length; j++) {\n        for (var m = 0; m < counts[j]; m++) out += chars[j];\n    }\n    return out;\n}`,
              java: `public static String removeDuplicates(String s, int k) {\n    List<Character> chars = new ArrayList<>();\n    List<Integer> counts = new ArrayList<>();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (!chars.isEmpty() && chars.get(chars.size() - 1) == c) {\n            counts.set(counts.size() - 1, counts.get(counts.size() - 1) + 1);\n        } else {\n            chars.add(c);\n            counts.add(1);\n        }\n        if (counts.get(counts.size() - 1) == k) {\n            chars.remove(chars.size() - 1);\n            counts.remove(counts.size() - 1);\n        }\n    }\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < chars.size(); i++) {\n        for (int j = 0; j < counts.get(i); j++) out.append(chars.get(i));\n    }\n    return out.toString();\n}`,
              cpp: `string removeDuplicates(string s, int k) {\n    vector<char> chars;\n    vector<int> counts;\n    for (char c : s) {\n        if (!chars.empty() && chars.back() == c) {\n            counts.back()++;\n        } else {\n            chars.push_back(c);\n            counts.push_back(1);\n        }\n        if (counts.back() == k) {\n            chars.pop_back();\n            counts.pop_back();\n        }\n    }\n    string out;\n    for (size_t i = 0; i < chars.size(); i++) {\n        out.append((size_t) counts[i], chars[i]);\n    }\n    return out;\n}`,
              c: `char* removeDuplicates(const char* s, int k) {\n    int n = (int) strlen(s);\n    char* chars = (char*) malloc((size_t) n + 1);\n    int* counts = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (top > 0 && chars[top - 1] == s[i]) {\n            counts[top - 1]++;\n        } else {\n            chars[top] = s[i];\n            counts[top] = 1;\n            top++;\n        }\n        if (counts[top - 1] == k) top--;\n    }\n    char* out = (char*) malloc((size_t) n + 2);\n    int len = 0;\n    for (int i = 0; i < top; i++) {\n        for (int j = 0; j < counts[i]; j++) out[len++] = chars[i];\n    }\n    out[len] = '\\0';\n    free(chars);\n    free(counts);\n    return out;\n}`,
              csharp: `public static string RemoveDuplicates(string s, int k)\n{\n    var chars = new List<char>();\n    var counts = new List<int>();\n    foreach (char c in s)\n    {\n        if (chars.Count > 0 && chars[chars.Count - 1] == c)\n        {\n            counts[counts.Count - 1]++;\n        }\n        else\n        {\n            chars.Add(c);\n            counts.Add(1);\n        }\n        if (counts[counts.Count - 1] == k)\n        {\n            chars.RemoveAt(chars.Count - 1);\n            counts.RemoveAt(counts.Count - 1);\n        }\n    }\n    var out_ = new System.Text.StringBuilder();\n    for (int i = 0; i < chars.Count; i++)\n    {\n        for (int j = 0; j < counts[i]; j++) out_.Append(chars[i]);\n    }\n    return out_.ToString();\n}`,
              go: `func removeDuplicates(s string, k int) string {\n	chars := []byte{}\n	counts := []int{}\n	for i := 0; i < len(s); i++ {\n		if len(chars) > 0 && chars[len(chars)-1] == s[i] {\n			counts[len(counts)-1]++\n		} else {\n			chars = append(chars, s[i])\n			counts = append(counts, 1)\n		}\n		if counts[len(counts)-1] == k {\n			chars = chars[:len(chars)-1]\n			counts = counts[:len(counts)-1]\n		}\n	}\n	out := []byte{}\n	for i := 0; i < len(chars); i++ {\n		for j := 0; j < counts[i]; j++ {\n			out = append(out, chars[i])\n		}\n	}\n	return string(out)\n}`,
              kotlin: `fun removeDuplicates(s: String, k: Int): String {\n    val chars = ArrayList<Char>()\n    val counts = ArrayList<Int>()\n    for (c in s) {\n        if (chars.isNotEmpty() && chars[chars.size - 1] == c) {\n            counts[counts.size - 1] = counts[counts.size - 1] + 1\n        } else {\n            chars.add(c)\n            counts.add(1)\n        }\n        if (counts[counts.size - 1] == k) {\n            chars.removeAt(chars.size - 1)\n            counts.removeAt(counts.size - 1)\n        }\n    }\n    val out = StringBuilder()\n    for (i in chars.indices) {\n        for (j in 0 until counts[i]) out.append(chars[i])\n    }\n    return out.toString()\n}`,
              swift: `func removeDuplicates(_ s: String, _ k: Int) -> String {\n    var chars: [Character] = []\n    var counts: [Int] = []\n    for c in s {\n        if let last = chars.last, last == c {\n            counts[counts.count - 1] += 1\n        } else {\n            chars.append(c)\n            counts.append(1)\n        }\n        if counts[counts.count - 1] == k {\n            chars.removeLast()\n            counts.removeLast()\n        }\n    }\n    var out = ""\n    for i in 0..<chars.count {\n        for _ in 0..<counts[i] { out.append(chars[i]) }\n    }\n    return out\n}`,
              rust: `fn removeDuplicates(s: String, k: i32) -> String {\n    let mut chars: Vec<u8> = Vec::new();\n    let mut counts: Vec<i32> = Vec::new();\n    for c in s.bytes() {\n        if !chars.is_empty() && chars[chars.len() - 1] == c {\n            let n = counts.len();\n            counts[n - 1] += 1;\n        } else {\n            chars.push(c);\n            counts.push(1);\n        }\n        if counts[counts.len() - 1] == k {\n            chars.pop();\n            counts.pop();\n        }\n    }\n    let mut out: Vec<u8> = Vec::new();\n    for i in 0..chars.len() {\n        for _ in 0..counts[i] {\n            out.push(chars[i]);\n        }\n    }\n    String::from_utf8(out).unwrap()\n}`,
              php: `function removeDuplicates($s, $k) {\n    $chars = array();\n    $counts = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        if (count($chars) > 0 && $chars[count($chars) - 1] === $c) {\n            $counts[count($counts) - 1]++;\n        } else {\n            $chars[] = $c;\n            $counts[] = 1;\n        }\n        if ($counts[count($counts) - 1] === $k) {\n            array_pop($chars);\n            array_pop($counts);\n        }\n    }\n    $out = "";\n    for ($i = 0; $i < count($chars); $i++) {\n        $out .= str_repeat($chars[$i], $counts[$i]);\n    }\n    return $out;\n}`,
              ruby: `def removeDuplicates(s, k)\n  chars = []\n  counts = []\n  s.each_char do |c|\n    if !chars.empty? && chars[-1] == c\n      counts[-1] += 1\n    else\n      chars.push(c)\n      counts.push(1)\n    end\n    if counts[-1] == k\n      chars.pop\n      counts.pop\n    end\n  end\n  out = ""\n  chars.each_with_index { |c, i| out << c * counts[i] }\n  out\nend`,
      },
    };
  })(),

  // ── Minimum Insertions to Balance a Parentheses String ──────────
  (() => {
    const ref = (s: string) => {
      let res = 0;
      let need = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") {
          need += 2;
          if (need % 2 === 1) {
            res++;
            need--;
          }
        } else {
          need--;
          if (need < 0) {
            res++;
            need = 1;
          }
        }
      }
      return res + need;
    };
    return {
      slug: "minimum-insertions-to-balance-a-parentheses-string",
      title: "Minimum Insertions to Balance a Parentheses String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Amazon", "Google"],
      signature: { funcName: "minInsertions", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "In this problem a parentheses string is **balanced** when every `'('` is matched by **two** consecutive `'))'`, in that order.\n\nGiven a string `s` of `'('` and `')'`, you may insert either bracket anywhere. Return the minimum number of insertions needed to make `s` balanced.",
        [
          { in: 's = "(()))"', out: "1", note: 'The inner "(" is closed by "))" but the outer one is one ")" short.' },
          { in: 's = "())"', out: "0" },
          { in: 's = "))())("', out: "3" },
        ],
        ["1 <= s.length <= 40", "s consists of '(' and ')'."]),
      hints: [
        "Track `need`, the number of `)` still owed. Each `(` adds 2 to it.",
        "If `need` ever turns odd when a `(` arrives, the previous group was left with a single `)` — insert one to square it up.",
        "A `)` with nothing owed needs a `(` inserted before it; whatever is still owed at the end is inserted at the end.",
      ],
      examples: [
        { input: '"(()))"', expectedOutput: "1" },
        { input: '"())"', expectedOutput: "0" },
        { input: '"))())("', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.5 ? "()" : "())");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minInsertions(s: str) -> int:\n    res = 0\n    need = 0\n    for ch in s:\n        if ch == "(":\n            need += 2\n            if need % 2 == 1:\n                res += 1\n                need -= 1\n        else:\n            need -= 1\n            if need < 0:\n                res += 1\n                need = 1\n    return res + need`,
        javascript: `var minInsertions = function(s) {\n    let res = 0;\n    let need = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            need += 2;\n            if (need % 2 === 1) {\n                res++;\n                need--;\n            }\n        } else {\n            need--;\n            if (need < 0) {\n                res++;\n                need = 1;\n            }\n        }\n    }\n    return res + need;\n};`,
              typescript: `function minInsertions(s: string): number {\n    var res = 0;\n    var need = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            need += 2;\n            if (need % 2 === 1) {\n                res++;\n                need--;\n            }\n        } else {\n            need--;\n            if (need < 0) {\n                res++;\n                need = 1;\n            }\n        }\n    }\n    return res + need;\n}`,
              java: `public static int minInsertions(String s) {\n    int res = 0, need = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '(') {\n            need += 2;\n            if (need % 2 == 1) {\n                res++;\n                need--;\n            }\n        } else {\n            need--;\n            if (need < 0) {\n                res++;\n                need = 1;\n            }\n        }\n    }\n    return res + need;\n}`,
              cpp: `int minInsertions(string s) {\n    int res = 0, need = 0;\n    for (char c : s) {\n        if (c == '(') {\n            need += 2;\n            if (need % 2 == 1) {\n                res++;\n                need--;\n            }\n        } else {\n            need--;\n            if (need < 0) {\n                res++;\n                need = 1;\n            }\n        }\n    }\n    return res + need;\n}`,
              c: `int minInsertions(const char* s) {\n    int res = 0, need = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == '(') {\n            need += 2;\n            if (need % 2 == 1) {\n                res++;\n                need--;\n            }\n        } else {\n            need--;\n            if (need < 0) {\n                res++;\n                need = 1;\n            }\n        }\n    }\n    return res + need;\n}`,
              csharp: `public static int MinInsertions(string s)\n{\n    int res = 0, need = 0;\n    foreach (char c in s)\n    {\n        if (c == '(')\n        {\n            need += 2;\n            if (need % 2 == 1)\n            {\n                res++;\n                need--;\n            }\n        }\n        else\n        {\n            need--;\n            if (need < 0)\n            {\n                res++;\n                need = 1;\n            }\n        }\n    }\n    return res + need;\n}`,
              go: `func minInsertions(s string) int {\n	res, need := 0, 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			need += 2\n			if need%2 == 1 {\n				res++\n				need--\n			}\n		} else {\n			need--\n			if need < 0 {\n				res++\n				need = 1\n			}\n		}\n	}\n	return res + need\n}`,
              kotlin: `fun minInsertions(s: String): Int {\n    var res = 0\n    var need = 0\n    for (c in s) {\n        if (c == '(') {\n            need += 2\n            if (need % 2 == 1) {\n                res++\n                need--\n            }\n        } else {\n            need--\n            if (need < 0) {\n                res++\n                need = 1\n            }\n        }\n    }\n    return res + need\n}`,
              swift: `func minInsertions(_ s: String) -> Int {\n    var res = 0\n    var need = 0\n    for c in s {\n        if c == "(" {\n            need += 2\n            if need % 2 == 1 {\n                res += 1\n                need -= 1\n            }\n        } else {\n            need -= 1\n            if need < 0 {\n                res += 1\n                need = 1\n            }\n        }\n    }\n    return res + need\n}`,
              rust: `fn minInsertions(s: String) -> i32 {\n    let mut res = 0;\n    let mut need = 0;\n    for c in s.bytes() {\n        if c == b'(' {\n            need += 2;\n            if need % 2 == 1 {\n                res += 1;\n                need -= 1;\n            }\n        } else {\n            need -= 1;\n            if need < 0 {\n                res += 1;\n                need = 1;\n            }\n        }\n    }\n    res + need\n}`,
              php: `function minInsertions($s) {\n    $res = 0;\n    $need = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "(") {\n            $need += 2;\n            if ($need % 2 === 1) {\n                $res++;\n                $need--;\n            }\n        } else {\n            $need--;\n            if ($need < 0) {\n                $res++;\n                $need = 1;\n            }\n        }\n    }\n    return $res + $need;\n}`,
              ruby: `def minInsertions(s)\n  res = 0\n  need = 0\n  s.each_char do |c|\n    if c == "("\n      need += 2\n      if need % 2 == 1\n        res += 1\n        need -= 1\n      end\n    else\n      need -= 1\n      if need < 0\n        res += 1\n        need = 1\n      end\n    end\n  end\n  res + need\nend`,
      },
    };
  })(),

  // ── Buildings With an Ocean View ────────────────────────────────
  (() => {
    const ref = (heights: number[]) => {
      const out: number[] = [];
      let tallest = 0;
      for (let i = heights.length - 1; i >= 0; i--) {
        if (heights[i] > tallest) {
          out.push(i);
          tallest = heights[i];
        }
      }
      out.reverse();
      return out;
    };
    return {
      slug: "buildings-with-an-ocean-view",
      title: "Buildings With an Ocean View",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Meta"],
      signature: { funcName: "findBuildings", params: [{ name: "heights", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` buildings in a line, and the ocean lies to the **right** of the last one. A building has an ocean view if every building to its right is **strictly shorter**.\n\nGiven the array `heights`, return the indices of the buildings that have an ocean view, sorted in ascending order.",
        [
          { in: "heights = [4,2,3,1]", out: "[0,2,3]" },
          { in: "heights = [4,3,2,1]", out: "[0,1,2,3]", note: "Every building sees the ocean." },
          { in: "heights = [1,3,2,4]", out: "[3]" },
        ],
        ["1 <= heights.length <= 40", "1 <= heights[i] <= 1000000000"]),
      hints: [
        "Scan from the right, remembering the tallest building seen so far.",
        "A building has a view exactly when it is strictly taller than that running maximum.",
        "Collect the indices in reverse, then flip them to get ascending order.",
      ],
      examples: [
        { input: "[4,2,3,1]", expectedOutput: "[0,2,3]" },
        { input: "[4,3,2,1]", expectedOutput: "[0,1,2,3]" },
        { input: "[1,3,2,4]", expectedOutput: "[3]" },
      ],
      gen: (rng: Rng) => {
        const heights = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.5 ? 10 : 1000000000);
        return { input: fmtIntArr(heights), expectedOutput: fmtIntArr(ref(heights)) };
      },
      solutions: {
        python: `def findBuildings(heights):\n    out = []\n    tallest = 0\n    for i in range(len(heights) - 1, -1, -1):\n        if heights[i] > tallest:\n            out.append(i)\n            tallest = heights[i]\n    out.reverse()\n    return out`,
        javascript: `var findBuildings = function(heights) {\n    const out = [];\n    let tallest = 0;\n    for (let i = heights.length - 1; i >= 0; i--) {\n        if (heights[i] > tallest) {\n            out.push(i);\n            tallest = heights[i];\n        }\n    }\n    out.reverse();\n    return out;\n};`,
              typescript: `function findBuildings(heights: number[]): number[] {\n    var out: number[] = [];\n    var tallest = 0;\n    for (var i = heights.length - 1; i >= 0; i--) {\n        if (heights[i] > tallest) {\n            out.push(i);\n            tallest = heights[i];\n        }\n    }\n    out.reverse();\n    return out;\n}`,
              java: `public static int[] findBuildings(int[] heights) {\n    List<Integer> collected = new ArrayList<>();\n    int tallest = 0;\n    for (int i = heights.length - 1; i >= 0; i--) {\n        if (heights[i] > tallest) {\n            collected.add(i);\n            tallest = heights[i];\n        }\n    }\n    int[] out = new int[collected.size()];\n    for (int i = 0; i < out.length; i++) out[i] = collected.get(out.length - 1 - i);\n    return out;\n}`,
              cpp: `vector<int> findBuildings(vector<int>& heights) {\n    vector<int> out;\n    int tallest = 0;\n    for (int i = (int) heights.size() - 1; i >= 0; i--) {\n        if (heights[i] > tallest) {\n            out.push_back(i);\n            tallest = heights[i];\n        }\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}`,
              c: `int* findBuildings(int* heights, int heightsSize, int* returnSize) {\n    int* tmp = (int*) malloc((size_t) (heightsSize > 0 ? heightsSize : 1) * sizeof(int));\n    int m = 0;\n    int tallest = 0;\n    for (int i = heightsSize - 1; i >= 0; i--) {\n        if (heights[i] > tallest) {\n            tmp[m++] = i;\n            tallest = heights[i];\n        }\n    }\n    int* out = (int*) malloc((size_t) (m > 0 ? m : 1) * sizeof(int));\n    for (int i = 0; i < m; i++) out[i] = tmp[m - 1 - i];\n    free(tmp);\n    *returnSize = m;\n    return out;\n}`,
              csharp: `public static int[] FindBuildings(int[] heights)\n{\n    var collected = new List<int>();\n    int tallest = 0;\n    for (int i = heights.Length - 1; i >= 0; i--)\n    {\n        if (heights[i] > tallest)\n        {\n            collected.Add(i);\n            tallest = heights[i];\n        }\n    }\n    collected.Reverse();\n    return collected.ToArray();\n}`,
              go: `func findBuildings(heights []int) []int {\n	out := []int{}\n	tallest := 0\n	for i := len(heights) - 1; i >= 0; i-- {\n		if heights[i] > tallest {\n			out = append(out, i)\n			tallest = heights[i]\n		}\n	}\n	for a, b := 0, len(out)-1; a < b; a, b = a+1, b-1 {\n		out[a], out[b] = out[b], out[a]\n	}\n	return out\n}`,
              kotlin: `fun findBuildings(heights: IntArray): IntArray {\n    val collected = ArrayList<Int>()\n    var tallest = 0\n    for (i in heights.size - 1 downTo 0) {\n        if (heights[i] > tallest) {\n            collected.add(i)\n            tallest = heights[i]\n        }\n    }\n    collected.reverse()\n    return collected.toIntArray()\n}`,
              swift: `func findBuildings(_ heights: [Int]) -> [Int] {\n    var out: [Int] = []\n    var tallest = 0\n    var i = heights.count - 1\n    while i >= 0 {\n        if heights[i] > tallest {\n            out.append(i)\n            tallest = heights[i]\n        }\n        i -= 1\n    }\n    out.reverse()\n    return out\n}`,
              rust: `fn findBuildings(heights: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut tallest = 0;\n    for i in (0..heights.len()).rev() {\n        if heights[i] > tallest {\n            out.push(i as i32);\n            tallest = heights[i];\n        }\n    }\n    out.reverse();\n    out\n}`,
              php: `function findBuildings($heights) {\n    $out = array();\n    $tallest = 0;\n    for ($i = count($heights) - 1; $i >= 0; $i--) {\n        if ($heights[$i] > $tallest) {\n            $out[] = $i;\n            $tallest = $heights[$i];\n        }\n    }\n    return array_reverse($out);\n}`,
              ruby: `def findBuildings(heights)\n  out = []\n  tallest = 0\n  (heights.length - 1).downto(0) do |i|\n    if heights[i] > tallest\n      out.push(i)\n      tallest = heights[i]\n    end\n  end\n  out.reverse\nend`,
      },
    };
  })(),
];
