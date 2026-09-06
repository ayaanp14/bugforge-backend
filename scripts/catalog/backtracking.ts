/** Backtracking — hand-authored classics with canonical (deterministic) output orders.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      editorial: explain({
        idea: "Each digit multiplies the number of answers by the size of its letter group, and the groups are independent. So instead of backtracking you can just grow the answer set one digit at a time: take every combination built so far and extend it by every letter of the next digit.",
        steps: [
          "Return an empty list immediately for an empty input — the answer is no combinations, not one empty combination.",
          "Map each digit to its keypad letters.",
          "Start with a single empty prefix, `[\"\"]`.",
          "For each digit, build a fresh list: every existing prefix concatenated with every letter of that digit's group.",
          "After the last digit, the list holds every combination.",
        ],
        why: "Every combination picks exactly one letter per digit, independently, so the set built after `i` digits is exactly the set of length-`i` prefixes of the final answers. Extending each prefix by each letter therefore produces every answer exactly once. Because prefixes stay in order and each digit's letters are visited in keypad order — which is alphabetical — the output comes out lexicographically sorted for free, with no sort at the end.",
        time: "O(4^n · n)",
        space: "O(4^n · n)",
        pitfalls: [
          "The empty string must return `[]`. Starting from `[\"\"]` and skipping the loop would return `[\"\"]`, which is one combination too many.",
          "Iterate the letters in keypad order. Any other order still produces the right set but breaks the required lexicographic output.",
          "`7` and `9` have four letters, not three — an off-by-one here silently drops answers.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef letterCombinations(digits: str) -> List[str]:\n    if not digits:\n        return []\n    mapping = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}\n    out = [""]\n    for d in digits:\n        out = [prefix + ch for prefix in out for ch in mapping[d]]\n    return out`,
        javascript: `var letterCombinations = function(digits) {\n    if (digits.length === 0) return [];\n    const map = { "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz" };\n    let out = [""];\n    for (const d of digits) {\n        const next = [];\n        for (const prefix of out) {\n            for (const ch of map[d]) next.push(prefix + ch);\n        }\n        out = next;\n    }\n    return out;\n};`,
              typescript: `function letterCombinations(digits: string): string[] {\n    if (digits.length === 0) return [];\n    const map: { [k: string]: string } = { "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz" };\n    let out: string[] = [""];\n    for (let i = 0; i < digits.length; i++) {\n        const letters = map[digits[i]];\n        const next: string[] = [];\n        for (let p = 0; p < out.length; p++) {\n            for (let c = 0; c < letters.length; c++) next.push(out[p] + letters[c]);\n        }\n        out = next;\n    }\n    return out;\n}`,
              java: `public static String[] letterCombinations(String digits) {\n    if (digits.length() == 0) return new String[0];\n    String[] map = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};\n    List<String> out = new ArrayList<>();\n    out.add("");\n    for (char d : digits.toCharArray()) {\n        String letters = map[d - '0'];\n        List<String> next = new ArrayList<>();\n        for (String prefix : out) {\n            for (char ch : letters.toCharArray()) next.add(prefix + ch);\n        }\n        out = next;\n    }\n    return out.toArray(new String[0]);\n}`,
              cpp: `vector<string> letterCombinations(string digits) {\n    if (digits.empty()) return vector<string>();\n    string map[10] = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};\n    vector<string> out;\n    out.push_back("");\n    for (char d : digits) {\n        string letters = map[d - '0'];\n        vector<string> next;\n        for (const string& prefix : out) {\n            for (char ch : letters) next.push_back(prefix + ch);\n        }\n        out = next;\n    }\n    return out;\n}`,
              c: `char** letterCombinations(const char* digits, int* returnSize) {\n    int n = (int) strlen(digits);\n    if (n == 0) {\n        *returnSize = 0;\n        return (char**) malloc(sizeof(char*));\n    }\n    const char* map[10] = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};\n    int total = 1;\n    for (int i = 0; i < n; i++) total *= (int) strlen(map[digits[i] - '0']);\n    char** out = (char**) malloc(total * sizeof(char*));\n    for (int i = 0; i < total; i++) {\n        out[i] = (char*) malloc(n + 1);\n        out[i][n] = '\\0';\n    }\n    int block = total;\n    for (int i = 0; i < n; i++) {\n        const char* letters = map[digits[i] - '0'];\n        int m = (int) strlen(letters);\n        block /= m;\n        for (int j = 0; j < total; j++) {\n            out[j][i] = letters[(j / block) % m];\n        }\n    }\n    *returnSize = total;\n    return out;\n}`,
              csharp: `public static string[] LetterCombinations(string digits)\n{\n    if (digits.Length == 0) return new string[0];\n    string[] map = { "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz" };\n    var cur = new List<string>();\n    cur.Add("");\n    foreach (char d in digits)\n    {\n        string letters = map[d - '0'];\n        var next = new List<string>();\n        foreach (string prefix in cur)\n        {\n            foreach (char ch in letters) next.Add(prefix + ch);\n        }\n        cur = next;\n    }\n    return cur.ToArray();\n}`,
              go: `func letterCombinations(digits string) []string {\n	if len(digits) == 0 {\n		return []string{}\n	}\n	m := []string{"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}\n	out := []string{""}\n	for i := 0; i < len(digits); i++ {\n		letters := m[digits[i]-'0']\n		next := []string{}\n		for _, prefix := range out {\n			for j := 0; j < len(letters); j++ {\n				next = append(next, prefix+string(letters[j]))\n			}\n		}\n		out = next\n	}\n	return out\n}`,
              kotlin: `fun letterCombinations(digits: String): Array<String> {\n    if (digits.isEmpty()) return arrayOf()\n    val map = arrayOf("", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz")\n    var out = mutableListOf("")\n    for (d in digits) {\n        val letters = map[d - '0']\n        val next = mutableListOf<String>()\n        for (prefix in out) {\n            for (ch in letters) next.add(prefix + ch)\n        }\n        out = next\n    }\n    return out.toTypedArray()\n}`,
              swift: `func letterCombinations(_ digits: String) -> [String] {\n    if digits.isEmpty { return [] }\n    let map = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]\n    var out = [""]\n    for d in digits {\n        let idx = Int(String(d))!\n        let letters = Array(map[idx])\n        var next: [String] = []\n        for prefix in out {\n            for ch in letters { next.append(prefix + String(ch)) }\n        }\n        out = next\n    }\n    return out\n}`,
              rust: `fn letterCombinations(digits: String) -> Vec<String> {\n    if digits.is_empty() {\n        return Vec::new();\n    }\n    let map = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];\n    let mut out: Vec<String> = vec![String::new()];\n    for d in digits.chars() {\n        let idx = d.to_digit(10).unwrap() as usize;\n        let letters = map[idx];\n        let mut next: Vec<String> = Vec::new();\n        for prefix in out.iter() {\n            for ch in letters.chars() {\n                next.push(format!("{}{}", prefix, ch));\n            }\n        }\n        out = next;\n    }\n    out\n}`,
              php: `function letterCombinations($digits) {\n    if (strlen($digits) === 0) return array();\n    $map = array("", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz");\n    $out = array("");\n    $n = strlen($digits);\n    for ($i = 0; $i < $n; $i++) {\n        $letters = $map[intval($digits[$i])];\n        $m = strlen($letters);\n        $next = array();\n        foreach ($out as $prefix) {\n            for ($j = 0; $j < $m; $j++) $next[] = $prefix . $letters[$j];\n        }\n        $out = $next;\n    }\n    return $out;\n}`,
              ruby: `def letterCombinations(digits)\n  return [] if digits.empty?\n  map = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]\n  out = [""]\n  digits.each_char do |d|\n    letters = map[d.to_i]\n    nxt = []\n    out.each do |prefix|\n      letters.each_char { |ch| nxt.push(prefix + ch) }\n    end\n    out = nxt\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "Do not generate all 2^(2n) bracket strings and filter. Instead, only ever build strings that are still *capable* of being valid: you may add `(` while you have opens left, and `)` only while there are more opens than closes so far. Every leaf of that search is a valid answer, so nothing is wasted.",
        steps: [
          "Recurse carrying the string built so far plus two counters: `open` and `close`, how many of each have been placed.",
          "When the string reaches length `2n`, it is complete and valid — record it.",
          "If `open < n`, you are allowed another `(` — recurse with it.",
          "If `close < open`, there is an unmatched `(` waiting, so `)` is legal — recurse with it.",
          "Try `(` before `)` at every step.",
        ],
        why: "A bracket string is valid exactly when no prefix has more `)` than `(`, and the totals match. The `close < open` guard enforces the prefix condition at every single step, and the length check enforces the totals, so every string reaching the base case is valid. Conversely any valid string obeys both rules at each character, so the search reaches it. Since `(` sorts before `)` and is always tried first, the answers come out in lexicographic order without sorting.",
        time: "O(4^n / sqrt(n))",
        space: "O(n)",
        pitfalls: [
          "The guard for `)` is `close < open`, not `close < n`. Using `n` lets you close a bracket that was never opened.",
          "Both branches are `if`, not `else if` — most states can legally do either, and skipping one loses answers.",
          "Try `(` first if you need lexicographic output; the set is the same either way, but the order is not.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef generateParenthesis(n: int) -> List[str]:\n    out = []\n\n    def go(cur, open_count, close_count):\n        if len(cur) == 2 * n:\n            out.append(cur)\n            return\n        if open_count < n:\n            go(cur + "(", open_count + 1, close_count)\n        if close_count < open_count:\n            go(cur + ")", open_count, close_count + 1)\n\n    go("", 0, 0)\n    return out`,
        javascript: `var generateParenthesis = function(n) {\n    const out = [];\n    function go(cur, open, close) {\n        if (cur.length === 2 * n) {\n            out.push(cur);\n            return;\n        }\n        if (open < n) go(cur + "(", open + 1, close);\n        if (close < open) go(cur + ")", open, close + 1);\n    }\n    go("", 0, 0);\n    return out;\n};`,
              typescript: `function generateParenthesis(n: number): string[] {\n    const out: string[] = [];\n    function go(cur: string, open: number, close: number): void {\n        if (cur.length === 2 * n) {\n            out.push(cur);\n            return;\n        }\n        if (open < n) go(cur + "(", open + 1, close);\n        if (close < open) go(cur + ")", open, close + 1);\n    }\n    go("", 0, 0);\n    return out;\n}`,
              java: `public static String[] generateParenthesis(int n) {\n    List<String> out = new ArrayList<>();\n    goGen(out, "", 0, 0, n);\n    return out.toArray(new String[0]);\n}\n\nprivate static void goGen(List<String> out, String cur, int open, int close, int n) {\n    if (cur.length() == 2 * n) {\n        out.add(cur);\n        return;\n    }\n    if (open < n) goGen(out, cur + "(", open + 1, close, n);\n    if (close < open) goGen(out, cur + ")", open, close + 1, n);\n}`,
              cpp: `void goGen(vector<string>& out, string cur, int open, int close, int n) {\n    if ((int) cur.size() == 2 * n) {\n        out.push_back(cur);\n        return;\n    }\n    if (open < n) goGen(out, cur + "(", open + 1, close, n);\n    if (close < open) goGen(out, cur + ")", open, close + 1, n);\n}\n\nvector<string> generateParenthesis(int n) {\n    vector<string> out;\n    goGen(out, "", 0, 0, n);\n    return out;\n}`,
              c: `static void goGen(char** out, int* count, char* cur, int len, int open, int close, int n) {\n    if (len == 2 * n) {\n        cur[len] = '\\0';\n        out[*count] = (char*) malloc(len + 1);\n        strcpy(out[*count], cur);\n        (*count)++;\n        return;\n    }\n    if (open < n) {\n        cur[len] = '(';\n        goGen(out, count, cur, len + 1, open + 1, close, n);\n    }\n    if (close < open) {\n        cur[len] = ')';\n        goGen(out, count, cur, len + 1, open, close + 1, n);\n    }\n}\n\nchar** generateParenthesis(int n, int* returnSize) {\n    int cap = 1;\n    for (int i = 0; i < 2 * n; i++) cap *= 2;\n    char** out = (char**) malloc(cap * sizeof(char*));\n    char* cur = (char*) malloc(2 * n + 2);\n    int count = 0;\n    goGen(out, &count, cur, 0, 0, 0, n);\n    free(cur);\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static string[] GenerateParenthesis(int n)\n{\n    var res = new List<string>();\n    GoGen(res, "", 0, 0, n);\n    return res.ToArray();\n}\n\nprivate static void GoGen(List<string> res, string cur, int open, int close, int n)\n{\n    if (cur.Length == 2 * n)\n    {\n        res.Add(cur);\n        return;\n    }\n    if (open < n) GoGen(res, cur + "(", open + 1, close, n);\n    if (close < open) GoGen(res, cur + ")", open, close + 1, n);\n}`,
              go: `func generateParenthesis(n int) []string {\n	out := []string{}\n	var rec func(cur string, opened int, closed int)\n	rec = func(cur string, opened int, closed int) {\n		if len(cur) == 2*n {\n			out = append(out, cur)\n			return\n		}\n		if opened < n {\n			rec(cur+"(", opened+1, closed)\n		}\n		if closed < opened {\n			rec(cur+")", opened, closed+1)\n		}\n	}\n	rec("", 0, 0)\n	return out\n}`,
              kotlin: `fun generateParenthesis(n: Int): Array<String> {\n    val out = mutableListOf<String>()\n    fun go(cur: String, open: Int, close: Int) {\n        if (cur.length == 2 * n) {\n            out.add(cur)\n            return\n        }\n        if (open < n) go(cur + "(", open + 1, close)\n        if (close < open) go(cur + ")", open, close + 1)\n    }\n    go("", 0, 0)\n    return out.toTypedArray()\n}`,
              swift: `func generateParenthesis(_ n: Int) -> [String] {\n    var out: [String] = []\n    func go(_ cur: String, _ open: Int, _ close: Int) {\n        if cur.count == 2 * n {\n            out.append(cur)\n            return\n        }\n        if open < n { go(cur + "(", open + 1, close) }\n        if close < open { go(cur + ")", open, close + 1) }\n    }\n    go("", 0, 0)\n    return out\n}`,
              rust: `fn generateParenthesis(n: i32) -> Vec<String> {\n    fn go(out: &mut Vec<String>, cur: &mut String, open: i32, close: i32, n: i32) {\n        if cur.len() as i32 == 2 * n {\n            out.push(cur.clone());\n            return;\n        }\n        if open < n {\n            cur.push('(');\n            go(out, cur, open + 1, close, n);\n            cur.pop();\n        }\n        if close < open {\n            cur.push(')');\n            go(out, cur, open, close + 1, n);\n            cur.pop();\n        }\n    }\n    let mut out: Vec<String> = Vec::new();\n    let mut cur = String::new();\n    go(&mut out, &mut cur, 0, 0, n);\n    out\n}`,
              php: `function generateParenthesis($n) {\n    $out = array();\n    genParenHelper($out, "", 0, 0, $n);\n    return $out;\n}\n\nfunction genParenHelper(&$out, $cur, $open, $close, $n) {\n    if (strlen($cur) === 2 * $n) {\n        $out[] = $cur;\n        return;\n    }\n    if ($open < $n) genParenHelper($out, $cur . "(", $open + 1, $close, $n);\n    if ($close < $open) genParenHelper($out, $cur . ")", $open, $close + 1, $n);\n}`,
              ruby: `def generateParenthesis(n)\n  out = []\n  go = lambda do |cur, opened, closed|\n    if cur.length == 2 * n\n      out.push(cur)\n      next\n    end\n    go.call(cur + "(", opened + 1, closed) if opened < n\n    go.call(cur + ")", opened, closed + 1) if closed < opened\n  end\n  go.call("", 0, 0)\n  out\nend`,
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
      editorial: explain({
        idea: "Think of building a subset by scanning the sorted values left to right and deciding how far to reach. At each step you may append any value *after* the last one you took. Recording the current subset the moment you arrive — before extending it — is what produces the required prefix (DFS) ordering.",
        steps: [
          "Sort `nums` ascending so every subset comes out in ascending order and the enumeration is deterministic.",
          "Recurse with a `start` index and the subset built so far.",
          "**First**, record a copy of the current subset. Even the empty one at the root counts.",
          "Then loop `i` from `start` to the end: append `nums[i]`, recurse with `i + 1`, and remove it again.",
          "Using `i + 1` (not `i`) means each value is used at most once.",
        ],
        why: "Fixing a `start` index means every subset is generated by exactly one increasing sequence of indices, so there are no duplicates and nothing is missed — that is precisely the power set. Recording before recursing is what makes a subset appear immediately before all of its extensions, which is the DFS/prefix order the problem asks for; recording at the leaves instead would list only the maximal subsets.",
        time: "O(2^n · n)",
        space: "O(2^n · n)",
        pitfalls: [
          "Push a **copy** of the working subset. Pushing the live array means every stored answer mutates as the search continues, and you end up with a list of identical empty arrays.",
          "Record before the loop, not after it, or you lose the prefix ordering.",
          "Undo the append after each recursive call — forgetting to backtrack leaks values into sibling branches.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef subsets(nums: List[int]) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n\n    def go(start, cur):\n        out.append(cur[:])\n        for i in range(start, len(s)):\n            cur.append(s[i])\n            go(i + 1, cur)\n            cur.pop()\n\n    go(0, [])\n    return out`,
        javascript: `var subsets = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    function go(start, cur) {\n        out.push(cur.slice());\n        for (let i = start; i < s.length; i++) {\n            cur.push(s[i]);\n            go(i + 1, cur);\n            cur.pop();\n        }\n    }\n    go(0, []);\n    return out;\n};`,
              typescript: `function subsets(nums: number[]): number[][] {\n    const s = nums.slice().sort(function (a, b) { return a - b; });\n    const out: number[][] = [];\n    const cur: number[] = [];\n    function go(start: number): void {\n        out.push(cur.slice());\n        for (let i = start; i < s.length; i++) {\n            cur.push(s[i]);\n            go(i + 1);\n            cur.pop();\n        }\n    }\n    go(0);\n    return out;\n}`,
              java: `public static int[][] subsets(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    List<int[]> out = new ArrayList<>();\n    List<Integer> cur = new ArrayList<>();\n    goSubsets(out, s, 0, cur);\n    return out.toArray(new int[0][]);\n}\n\nprivate static void goSubsets(List<int[]> out, int[] s, int start, List<Integer> cur) {\n    int[] snap = new int[cur.size()];\n    for (int i = 0; i < cur.size(); i++) snap[i] = cur.get(i);\n    out.add(snap);\n    for (int i = start; i < s.length; i++) {\n        cur.add(s[i]);\n        goSubsets(out, s, i + 1, cur);\n        cur.remove(cur.size() - 1);\n    }\n}`,
              cpp: `void goSubsets(vector<vector<int>>& out, vector<int>& s, int start, vector<int>& cur) {\n    out.push_back(cur);\n    for (int i = start; i < (int) s.size(); i++) {\n        cur.push_back(s[i]);\n        goSubsets(out, s, i + 1, cur);\n        cur.pop_back();\n    }\n}\n\nvector<vector<int>> subsets(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    vector<vector<int>> out;\n    vector<int> cur;\n    goSubsets(out, s, 0, cur);\n    return out;\n}`,
              c: `static int cmpSubsetAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic void goSubsets(int** out, int* cols, int* count, int* s, int n, int start, int* cur, int depth) {\n    int* snap = (int*) malloc((depth > 0 ? depth : 1) * sizeof(int));\n    for (int i = 0; i < depth; i++) snap[i] = cur[i];\n    out[*count] = snap;\n    cols[*count] = depth;\n    (*count)++;\n    for (int i = start; i < n; i++) {\n        cur[depth] = s[i];\n        goSubsets(out, cols, count, s, n, i + 1, cur, depth + 1);\n    }\n}\n\nint** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    int n = numsSize;\n    int* s = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = nums[i];\n    qsort(s, n, sizeof(int), cmpSubsetAsc);\n    int total = 1;\n    for (int i = 0; i < n; i++) total *= 2;\n    int** out = (int**) malloc(total * sizeof(int*));\n    int* cols = (int*) malloc(total * sizeof(int));\n    int* cur = (int*) malloc((n + 1) * sizeof(int));\n    int count = 0;\n    goSubsets(out, cols, &count, s, n, 0, cur, 0);\n    free(cur);\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] Subsets(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    var res = new List<int[]>();\n    var cur = new List<int>();\n    GoSubsets(res, s, 0, cur);\n    return res.ToArray();\n}\n\nprivate static void GoSubsets(List<int[]> res, int[] s, int start, List<int> cur)\n{\n    res.Add(cur.ToArray());\n    for (int i = start; i < s.Length; i++)\n    {\n        cur.Add(s[i]);\n        GoSubsets(res, s, i + 1, cur);\n        cur.RemoveAt(cur.Count - 1);\n    }\n}`,
              go: `func subsets(nums []int) [][]int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	out := [][]int{}\n	cur := []int{}\n	var rec func(start int)\n	rec = func(start int) {\n		out = append(out, append([]int{}, cur...))\n		for i := start; i < len(s); i++ {\n			cur = append(cur, s[i])\n			rec(i + 1)\n			cur = cur[:len(cur)-1]\n		}\n	}\n	rec(0)\n	return out\n}`,
              kotlin: `fun subsets(nums: IntArray): Array<IntArray> {\n    val s = nums.sortedArray()\n    val out = mutableListOf<IntArray>()\n    val cur = mutableListOf<Int>()\n    fun go(start: Int) {\n        out.add(cur.toIntArray())\n        for (i in start until s.size) {\n            cur.add(s[i])\n            go(i + 1)\n            cur.removeAt(cur.size - 1)\n        }\n    }\n    go(0)\n    return out.toTypedArray()\n}`,
              swift: `func subsets(_ nums: [Int]) -> [[Int]] {\n    let s = nums.sorted()\n    var out: [[Int]] = []\n    var cur: [Int] = []\n    func go(_ start: Int) {\n        out.append(cur)\n        for i in start..<s.count {\n            cur.append(s[i])\n            go(i + 1)\n            cur.removeLast()\n        }\n    }\n    go(0)\n    return out\n}`,
              rust: `fn subsets(nums: Vec<i32>) -> Vec<Vec<i32>> {\n    fn go(out: &mut Vec<Vec<i32>>, s: &Vec<i32>, start: usize, cur: &mut Vec<i32>) {\n        out.push(cur.clone());\n        for i in start..s.len() {\n            cur.push(s[i]);\n            go(out, s, i + 1, cur);\n            cur.pop();\n        }\n    }\n    let mut s = nums.clone();\n    s.sort();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut cur: Vec<i32> = Vec::new();\n    go(&mut out, &s, 0, &mut cur);\n    out\n}`,
              php: `function subsets($nums) {\n    $s = $nums;\n    sort($s);\n    $out = array();\n    subsetsHelper($out, $s, 0, array());\n    return $out;\n}\n\nfunction subsetsHelper(&$out, $s, $start, $cur) {\n    $out[] = $cur;\n    $n = count($s);\n    for ($i = $start; $i < $n; $i++) {\n        $next = $cur;\n        $next[] = $s[$i];\n        subsetsHelper($out, $s, $i + 1, $next);\n    }\n}`,
              ruby: `def subsets(nums)\n  s = nums.sort\n  out = []\n  cur = []\n  go = lambda do |start|\n    out.push(cur.dup)\n    (start...s.length).each do |i|\n      cur.push(s[i])\n      go.call(i + 1)\n      cur.pop\n    end\n  end\n  go.call(0)\n  out\nend`,
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
      editorial: explain({
        idea: "A permutation uses every value exactly once, so unlike subsets there is no `start` index to move forward — any unused value may come next. Track which positions are already spent with a `used` array, and always scan candidates in sorted order so the output is lexicographic.",
        steps: [
          "Sort `nums` ascending; the smallest permutation must come first.",
          "Keep a `used` flag per index and a partial arrangement `cur`.",
          "When `cur` holds all `n` values, record a copy — that is one complete permutation.",
          "Otherwise loop over every index, skip the used ones, and for each unused index: mark it, append its value, recurse, then unmark and remove it.",
          "Scanning indices in ascending order at every level keeps the answers sorted.",
        ],
        why: "Each recursion level fixes exactly one position of the arrangement, and the loop tries every value still available for it. That covers all `n!` orderings once each: two different runs must differ at the first level where they chose a different index. Because the values are sorted and each level walks them low to high, the permutations are produced in lexicographic order directly.",
        time: "O(n! · n)",
        space: "O(n! · n)",
        pitfalls: [
          "Both parts of the state have to be undone after the recursive call — clear the `used` flag *and* pop the value. Undoing only one corrupts every later branch.",
          "There is no `start` index here; using one would generate combinations, not permutations.",
          "Store a copy at the base case, not the live working array.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef permute(nums: List[int]) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n    used = [False] * len(s)\n\n    def go(cur):\n        if len(cur) == len(s):\n            out.append(cur[:])\n            return\n        for i in range(len(s)):\n            if used[i]:\n                continue\n            used[i] = True\n            cur.append(s[i])\n            go(cur)\n            cur.pop()\n            used[i] = False\n\n    go([])\n    return out`,
        javascript: `var permute = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    const used = new Array(s.length).fill(false);\n    function go(cur) {\n        if (cur.length === s.length) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = 0; i < s.length; i++) {\n            if (used[i]) continue;\n            used[i] = true;\n            cur.push(s[i]);\n            go(cur);\n            cur.pop();\n            used[i] = false;\n        }\n    }\n    go([]);\n    return out;\n};`,
              typescript: `function permute(nums: number[]): number[][] {\n    const s = nums.slice().sort(function (a, b) { return a - b; });\n    const out: number[][] = [];\n    const used: boolean[] = [];\n    for (let i = 0; i < s.length; i++) used.push(false);\n    const cur: number[] = [];\n    function go(): void {\n        if (cur.length === s.length) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = 0; i < s.length; i++) {\n            if (used[i]) continue;\n            used[i] = true;\n            cur.push(s[i]);\n            go();\n            cur.pop();\n            used[i] = false;\n        }\n    }\n    go();\n    return out;\n}`,
              java: `public static int[][] permute(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    List<int[]> out = new ArrayList<>();\n    boolean[] used = new boolean[s.length];\n    int[] cur = new int[s.length];\n    goPermute(out, s, used, cur, 0);\n    return out.toArray(new int[0][]);\n}\n\nprivate static void goPermute(List<int[]> out, int[] s, boolean[] used, int[] cur, int depth) {\n    if (depth == s.length) {\n        out.add(cur.clone());\n        return;\n    }\n    for (int i = 0; i < s.length; i++) {\n        if (used[i]) continue;\n        used[i] = true;\n        cur[depth] = s[i];\n        goPermute(out, s, used, cur, depth + 1);\n        used[i] = false;\n    }\n}`,
              cpp: `void goPermute(vector<vector<int>>& out, vector<int>& s, vector<bool>& used, vector<int>& cur) {\n    if (cur.size() == s.size()) {\n        out.push_back(cur);\n        return;\n    }\n    for (size_t i = 0; i < s.size(); i++) {\n        if (used[i]) continue;\n        used[i] = true;\n        cur.push_back(s[i]);\n        goPermute(out, s, used, cur);\n        cur.pop_back();\n        used[i] = false;\n    }\n}\n\nvector<vector<int>> permute(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    vector<vector<int>> out;\n    vector<bool> used(s.size(), false);\n    vector<int> cur;\n    goPermute(out, s, used, cur);\n    return out;\n}`,
              c: `static int cmpPermAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic void goPermute(int** out, int* cols, int* count, int* s, int n, int* used, int* cur, int depth) {\n    if (depth == n) {\n        int* snap = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n        for (int i = 0; i < n; i++) snap[i] = cur[i];\n        out[*count] = snap;\n        cols[*count] = n;\n        (*count)++;\n        return;\n    }\n    for (int i = 0; i < n; i++) {\n        if (used[i]) continue;\n        used[i] = 1;\n        cur[depth] = s[i];\n        goPermute(out, cols, count, s, n, used, cur, depth + 1);\n        used[i] = 0;\n    }\n}\n\nint** permute(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    int n = numsSize;\n    int* s = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = nums[i];\n    qsort(s, n, sizeof(int), cmpPermAsc);\n    int total = 1;\n    for (int i = 2; i <= n; i++) total *= i;\n    int** out = (int**) malloc((total > 0 ? total : 1) * sizeof(int*));\n    int* cols = (int*) malloc((total > 0 ? total : 1) * sizeof(int));\n    int* used = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    int* cur = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    goPermute(out, cols, &count, s, n, used, cur, 0);\n    free(used);\n    free(cur);\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] Permute(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    var res = new List<int[]>();\n    bool[] used = new bool[s.Length];\n    int[] cur = new int[s.Length];\n    GoPermute(res, s, used, cur, 0);\n    return res.ToArray();\n}\n\nprivate static void GoPermute(List<int[]> res, int[] s, bool[] used, int[] cur, int depth)\n{\n    if (depth == s.Length)\n    {\n        res.Add((int[]) cur.Clone());\n        return;\n    }\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (used[i]) continue;\n        used[i] = true;\n        cur[depth] = s[i];\n        GoPermute(res, s, used, cur, depth + 1);\n        used[i] = false;\n    }\n}`,
              go: `func permute(nums []int) [][]int {\n	s := append([]int{}, nums...)\n	sort.Ints(s)\n	out := [][]int{}\n	used := make([]bool, len(s))\n	cur := []int{}\n	var rec func()\n	rec = func() {\n		if len(cur) == len(s) {\n			out = append(out, append([]int{}, cur...))\n			return\n		}\n		for i := 0; i < len(s); i++ {\n			if used[i] {\n				continue\n			}\n			used[i] = true\n			cur = append(cur, s[i])\n			rec()\n			cur = cur[:len(cur)-1]\n			used[i] = false\n		}\n	}\n	rec()\n	return out\n}`,
              kotlin: `fun permute(nums: IntArray): Array<IntArray> {\n    val s = nums.sortedArray()\n    val out = mutableListOf<IntArray>()\n    val used = BooleanArray(s.size)\n    val cur = mutableListOf<Int>()\n    fun go() {\n        if (cur.size == s.size) {\n            out.add(cur.toIntArray())\n            return\n        }\n        for (i in s.indices) {\n            if (used[i]) continue\n            used[i] = true\n            cur.add(s[i])\n            go()\n            cur.removeAt(cur.size - 1)\n            used[i] = false\n        }\n    }\n    go()\n    return out.toTypedArray()\n}`,
              swift: `func permute(_ nums: [Int]) -> [[Int]] {\n    let s = nums.sorted()\n    var out: [[Int]] = []\n    var used = [Bool](repeating: false, count: s.count)\n    var cur: [Int] = []\n    func go() {\n        if cur.count == s.count {\n            out.append(cur)\n            return\n        }\n        for i in 0..<s.count {\n            if used[i] { continue }\n            used[i] = true\n            cur.append(s[i])\n            go()\n            cur.removeLast()\n            used[i] = false\n        }\n    }\n    go()\n    return out\n}`,
              rust: `fn permute(nums: Vec<i32>) -> Vec<Vec<i32>> {\n    fn go(out: &mut Vec<Vec<i32>>, s: &Vec<i32>, used: &mut Vec<bool>, cur: &mut Vec<i32>) {\n        if cur.len() == s.len() {\n            out.push(cur.clone());\n            return;\n        }\n        for i in 0..s.len() {\n            if used[i] {\n                continue;\n            }\n            used[i] = true;\n            cur.push(s[i]);\n            go(out, s, used, cur);\n            cur.pop();\n            used[i] = false;\n        }\n    }\n    let mut s = nums.clone();\n    s.sort();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut used = vec![false; s.len()];\n    let mut cur: Vec<i32> = Vec::new();\n    go(&mut out, &s, &mut used, &mut cur);\n    out\n}`,
              php: `function permute($nums) {\n    $s = $nums;\n    sort($s);\n    $out = array();\n    $used = array_fill(0, count($s), false);\n    permuteHelper($out, $s, $used, array());\n    return $out;\n}\n\nfunction permuteHelper(&$out, $s, $used, $cur) {\n    $n = count($s);\n    if (count($cur) === $n) {\n        $out[] = $cur;\n        return;\n    }\n    for ($i = 0; $i < $n; $i++) {\n        if ($used[$i]) continue;\n        $used[$i] = true;\n        $next = $cur;\n        $next[] = $s[$i];\n        permuteHelper($out, $s, $used, $next);\n        $used[$i] = false;\n    }\n}`,
              ruby: `def permute(nums)\n  s = nums.sort\n  out = []\n  used = Array.new(s.length, false)\n  cur = []\n  go = lambda do\n    if cur.length == s.length\n      out.push(cur.dup)\n      next\n    end\n    (0...s.length).each do |i|\n      next if used[i]\n      used[i] = true\n      cur.push(s[i])\n      go.call\n      cur.pop\n      used[i] = false\n    end\n  end\n  go.call\n  out\nend`,
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
      editorial: explain({
        idea: "A combination is an increasing sequence of `k` numbers drawn from `1..n`. Enforce \"increasing\" structurally: each recursion level picks a number strictly larger than the previous one by passing `i + 1` as the next starting point. That makes every combination reachable by exactly one path, so no duplicates and no need to sort or de-duplicate.",
        steps: [
          "Recurse with a `start` value and the combination built so far.",
          "When the combination holds `k` numbers, record a copy and stop.",
          "Otherwise loop `i` from `start` up to `n`.",
          "Append `i`, recurse with `start = i + 1`, then remove it.",
          "Because each level scans ascending and always moves right, the output is lexicographic.",
        ],
        why: "Every `k`-element subset of `1..n` has exactly one increasing arrangement, and the `start` index forces the search to build precisely that arrangement — so the search visits each combination once and only once. Advancing to `i + 1` rather than `i` is what forbids reusing a number.",
        time: "O(C(n,k) · k)",
        space: "O(C(n,k) · k)",
        pitfalls: [
          "The loop bound is inclusive (`i <= n`) because the numbers are `1..n`, not `0..n-1`.",
          "Recursing with `i` instead of `i + 1` allows repeats and turns this into a different problem.",
          "You can prune hard by stopping once too few numbers remain to reach length `k`; without it the search still works but explores dead branches.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef combine(n: int, k: int) -> List[List[int]]:\n    out = []\n\n    def go(start, cur):\n        if len(cur) == k:\n            out.append(cur[:])\n            return\n        for i in range(start, n + 1):\n            cur.append(i)\n            go(i + 1, cur)\n            cur.pop()\n\n    go(1, [])\n    return out`,
        javascript: `var combine = function(n, k) {\n    const out = [];\n    function go(start, cur) {\n        if (cur.length === k) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = start; i <= n; i++) {\n            cur.push(i);\n            go(i + 1, cur);\n            cur.pop();\n        }\n    }\n    go(1, []);\n    return out;\n};`,
              typescript: `function combine(n: number, k: number): number[][] {\n    const out: number[][] = [];\n    const cur: number[] = [];\n    function go(start: number): void {\n        if (cur.length === k) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = start; i <= n; i++) {\n            cur.push(i);\n            go(i + 1);\n            cur.pop();\n        }\n    }\n    go(1);\n    return out;\n}`,
              java: `public static int[][] combine(int n, int k) {\n    List<int[]> out = new ArrayList<>();\n    int[] cur = new int[k];\n    goCombine(out, n, k, 1, cur, 0);\n    return out.toArray(new int[0][]);\n}\n\nprivate static void goCombine(List<int[]> out, int n, int k, int start, int[] cur, int depth) {\n    if (depth == k) {\n        out.add(cur.clone());\n        return;\n    }\n    for (int i = start; i <= n; i++) {\n        cur[depth] = i;\n        goCombine(out, n, k, i + 1, cur, depth + 1);\n    }\n}`,
              cpp: `void goCombine(vector<vector<int>>& out, int n, int k, int start, vector<int>& cur) {\n    if ((int) cur.size() == k) {\n        out.push_back(cur);\n        return;\n    }\n    for (int i = start; i <= n; i++) {\n        cur.push_back(i);\n        goCombine(out, n, k, i + 1, cur);\n        cur.pop_back();\n    }\n}\n\nvector<vector<int>> combine(int n, int k) {\n    vector<vector<int>> out;\n    vector<int> cur;\n    goCombine(out, n, k, 1, cur);\n    return out;\n}`,
              c: `static void goCombine(int** out, int* cols, int* count, int n, int k, int start, int* cur, int depth) {\n    if (depth == k) {\n        int* snap = (int*) malloc((k > 0 ? k : 1) * sizeof(int));\n        for (int i = 0; i < k; i++) snap[i] = cur[i];\n        out[*count] = snap;\n        cols[*count] = k;\n        (*count)++;\n        return;\n    }\n    for (int i = start; i <= n; i++) {\n        cur[depth] = i;\n        goCombine(out, cols, count, n, k, i + 1, cur, depth + 1);\n    }\n}\n\nint** combine(int n, int k, int* returnSize, int** returnColumnSizes) {\n    int total = 1;\n    for (int i = 0; i < n; i++) total *= 2;\n    int** out = (int**) malloc(total * sizeof(int*));\n    int* cols = (int*) malloc(total * sizeof(int));\n    int* cur = (int*) malloc((k + 1) * sizeof(int));\n    int count = 0;\n    goCombine(out, cols, &count, n, k, 1, cur, 0);\n    free(cur);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] Combine(int n, int k)\n{\n    var res = new List<int[]>();\n    int[] cur = new int[k];\n    GoCombine(res, n, k, 1, cur, 0);\n    return res.ToArray();\n}\n\nprivate static void GoCombine(List<int[]> res, int n, int k, int start, int[] cur, int depth)\n{\n    if (depth == k)\n    {\n        res.Add((int[]) cur.Clone());\n        return;\n    }\n    for (int i = start; i <= n; i++)\n    {\n        cur[depth] = i;\n        GoCombine(res, n, k, i + 1, cur, depth + 1);\n    }\n}`,
              go: `func combine(n int, k int) [][]int {\n	out := [][]int{}\n	cur := []int{}\n	var rec func(start int)\n	rec = func(start int) {\n		if len(cur) == k {\n			out = append(out, append([]int{}, cur...))\n			return\n		}\n		for i := start; i <= n; i++ {\n			cur = append(cur, i)\n			rec(i + 1)\n			cur = cur[:len(cur)-1]\n		}\n	}\n	rec(1)\n	return out\n}`,
              kotlin: `fun combine(n: Int, k: Int): Array<IntArray> {\n    val out = mutableListOf<IntArray>()\n    val cur = mutableListOf<Int>()\n    fun go(start: Int) {\n        if (cur.size == k) {\n            out.add(cur.toIntArray())\n            return\n        }\n        for (i in start..n) {\n            cur.add(i)\n            go(i + 1)\n            cur.removeAt(cur.size - 1)\n        }\n    }\n    go(1)\n    return out.toTypedArray()\n}`,
              swift: `func combine(_ n: Int, _ k: Int) -> [[Int]] {\n    var out: [[Int]] = []\n    var cur: [Int] = []\n    func go(_ start: Int) {\n        if cur.count == k {\n            out.append(cur)\n            return\n        }\n        if start > n { return }\n        for i in start...n {\n            cur.append(i)\n            go(i + 1)\n            cur.removeLast()\n        }\n    }\n    go(1)\n    return out\n}`,
              rust: `fn combine(n: i32, k: i32) -> Vec<Vec<i32>> {\n    fn go(out: &mut Vec<Vec<i32>>, n: i32, k: i32, start: i32, cur: &mut Vec<i32>) {\n        if cur.len() as i32 == k {\n            out.push(cur.clone());\n            return;\n        }\n        let mut i = start;\n        while i <= n {\n            cur.push(i);\n            go(out, n, k, i + 1, cur);\n            cur.pop();\n            i += 1;\n        }\n    }\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut cur: Vec<i32> = Vec::new();\n    go(&mut out, n, k, 1, &mut cur);\n    out\n}`,
              php: `function combine($n, $k) {\n    $out = array();\n    combineHelper($out, $n, $k, 1, array());\n    return $out;\n}\n\nfunction combineHelper(&$out, $n, $k, $start, $cur) {\n    if (count($cur) === $k) {\n        $out[] = $cur;\n        return;\n    }\n    for ($i = $start; $i <= $n; $i++) {\n        $next = $cur;\n        $next[] = $i;\n        combineHelper($out, $n, $k, $i + 1, $next);\n    }\n}`,
              ruby: `def combine(n, k)\n  out = []\n  cur = []\n  go = lambda do |start|\n    if cur.length == k\n      out.push(cur.dup)\n      next\n    end\n    (start..n).each do |i|\n      cur.push(i)\n      go.call(i + 1)\n      cur.pop\n    end\n  end\n  go.call(1)\n  out\nend`,
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
      editorial: explain({
        idea: "Two rules do all the work. Passing a `start` index forbids going back to a smaller candidate, which keeps every combination non-decreasing and stops the same multiset being found in several orders. Recursing with the **same** index rather than the next one is what allows a number to be reused without limit.",
        steps: [
          "Sort `candidates` ascending — required both for the non-decreasing output and for the early break below.",
          "Recurse with a `start` index and the remaining amount `remain`.",
          "When `remain` hits exactly `0`, the current list is a valid combination — record a copy.",
          "Otherwise loop `i` from `start`: if `candidates[i] > remain`, **break** — everything further right is larger still, so no candidate can fit.",
          "Append `candidates[i]` and recurse with `start = i` (not `i + 1`), so the same value can be picked again, then remove it.",
        ],
        why: "Every multiset that sums to the target has exactly one non-decreasing arrangement, and the `start` rule means the search builds only that arrangement — so each answer is found once and duplicates are impossible without any de-duplication step. `remain` reaching `0` is the exact success condition, and since all candidates are positive, `remain` strictly decreases, guaranteeing the recursion terminates.",
        time: "O(n^(target / min candidate))",
        space: "O(target / min candidate)",
        pitfalls: [
          "Recurse with `i`, not `i + 1`. Using `i + 1` bans reuse and silently solves a different problem.",
          "The sorted `break` is what makes this fast; `continue` would still be correct but explores branches that cannot possibly work.",
          "Test `remain == 0` for success and let the `break` handle overshoot — a `remain < 0` check without sorting still works, but with sorting it is unreachable.",
          "A target that cannot be formed must return an empty list, not a list holding an empty combination.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef combinationSum(candidates: List[int], target: int) -> List[List[int]]:\n    s = sorted(candidates)\n    out = []\n\n    def go(start, remain, cur):\n        if remain == 0:\n            out.append(cur[:])\n            return\n        for i in range(start, len(s)):\n            if s[i] > remain:\n                break\n            cur.append(s[i])\n            go(i, remain - s[i], cur)\n            cur.pop()\n\n    go(0, target, [])\n    return out`,
        javascript: `var combinationSum = function(candidates, target) {\n    const s = candidates.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    function go(start, remain, cur) {\n        if (remain === 0) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = start; i < s.length; i++) {\n            if (s[i] > remain) break;\n            cur.push(s[i]);\n            go(i, remain - s[i], cur);\n            cur.pop();\n        }\n    }\n    go(0, target, []);\n    return out;\n};`,
              typescript: `function combinationSum(candidates: number[], target: number): number[][] {\n    const s = candidates.slice().sort(function (a, b) { return a - b; });\n    const out: number[][] = [];\n    const cur: number[] = [];\n    function go(start: number, remain: number): void {\n        if (remain === 0) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = start; i < s.length; i++) {\n            if (s[i] > remain) break;\n            cur.push(s[i]);\n            go(i, remain - s[i]);\n            cur.pop();\n        }\n    }\n    go(0, target);\n    return out;\n}`,
              java: `public static int[][] combinationSum(int[] candidates, int target) {\n    int[] s = candidates.clone();\n    Arrays.sort(s);\n    List<int[]> out = new ArrayList<>();\n    List<Integer> cur = new ArrayList<>();\n    goCombSum(out, s, 0, target, cur);\n    return out.toArray(new int[0][]);\n}\n\nprivate static void goCombSum(List<int[]> out, int[] s, int start, int remain, List<Integer> cur) {\n    if (remain == 0) {\n        int[] snap = new int[cur.size()];\n        for (int i = 0; i < cur.size(); i++) snap[i] = cur.get(i);\n        out.add(snap);\n        return;\n    }\n    for (int i = start; i < s.length; i++) {\n        if (s[i] > remain) break;\n        cur.add(s[i]);\n        goCombSum(out, s, i, remain - s[i], cur);\n        cur.remove(cur.size() - 1);\n    }\n}`,
              cpp: `void goCombSum(vector<vector<int>>& out, vector<int>& s, int start, int remain, vector<int>& cur) {\n    if (remain == 0) {\n        out.push_back(cur);\n        return;\n    }\n    for (int i = start; i < (int) s.size(); i++) {\n        if (s[i] > remain) break;\n        cur.push_back(s[i]);\n        goCombSum(out, s, i, remain - s[i], cur);\n        cur.pop_back();\n    }\n}\n\nvector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n    vector<int> s = candidates;\n    sort(s.begin(), s.end());\n    vector<vector<int>> out;\n    vector<int> cur;\n    goCombSum(out, s, 0, target, cur);\n    return out;\n}`,
              c: `static int cmpCsAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic void goCombSum(int** out, int* cols, int* count, int* s, int n, int start, int remain, int* cur, int depth) {\n    if (remain == 0) {\n        int* snap = (int*) malloc((depth > 0 ? depth : 1) * sizeof(int));\n        for (int i = 0; i < depth; i++) snap[i] = cur[i];\n        out[*count] = snap;\n        cols[*count] = depth;\n        (*count)++;\n        return;\n    }\n    for (int i = start; i < n; i++) {\n        if (s[i] > remain) break;\n        cur[depth] = s[i];\n        goCombSum(out, cols, count, s, n, i, remain - s[i], cur, depth + 1);\n    }\n}\n\nint** combinationSum(int* candidates, int candidatesSize, int target, int* returnSize, int** returnColumnSizes) {\n    int n = candidatesSize;\n    int* s = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) s[i] = candidates[i];\n    qsort(s, n, sizeof(int), cmpCsAsc);\n    int cap = 4096;\n    int** out = (int**) malloc(cap * sizeof(int*));\n    int* cols = (int*) malloc(cap * sizeof(int));\n    int* cur = (int*) malloc((target + 2) * sizeof(int));\n    int count = 0;\n    goCombSum(out, cols, &count, s, n, 0, target, cur, 0);\n    free(cur);\n    free(s);\n    *returnSize = count;\n    *returnColumnSizes = cols;\n    return out;\n}`,
              csharp: `public static int[][] CombinationSum(int[] candidates, int target)\n{\n    int[] s = (int[]) candidates.Clone();\n    Array.Sort(s);\n    var res = new List<int[]>();\n    var cur = new List<int>();\n    GoCombSum(res, s, 0, target, cur);\n    return res.ToArray();\n}\n\nprivate static void GoCombSum(List<int[]> res, int[] s, int start, int remain, List<int> cur)\n{\n    if (remain == 0)\n    {\n        res.Add(cur.ToArray());\n        return;\n    }\n    for (int i = start; i < s.Length; i++)\n    {\n        if (s[i] > remain) break;\n        cur.Add(s[i]);\n        GoCombSum(res, s, i, remain - s[i], cur);\n        cur.RemoveAt(cur.Count - 1);\n    }\n}`,
              go: `func combinationSum(candidates []int, target int) [][]int {\n	s := append([]int{}, candidates...)\n	sort.Ints(s)\n	out := [][]int{}\n	cur := []int{}\n	var rec func(start int, remain int)\n	rec = func(start int, remain int) {\n		if remain == 0 {\n			out = append(out, append([]int{}, cur...))\n			return\n		}\n		for i := start; i < len(s); i++ {\n			if s[i] > remain {\n				break\n			}\n			cur = append(cur, s[i])\n			rec(i, remain-s[i])\n			cur = cur[:len(cur)-1]\n		}\n	}\n	rec(0, target)\n	return out\n}`,
              kotlin: `fun combinationSum(candidates: IntArray, target: Int): Array<IntArray> {\n    val s = candidates.sortedArray()\n    val out = mutableListOf<IntArray>()\n    val cur = mutableListOf<Int>()\n    fun go(start: Int, remain: Int) {\n        if (remain == 0) {\n            out.add(cur.toIntArray())\n            return\n        }\n        for (i in start until s.size) {\n            if (s[i] > remain) break\n            cur.add(s[i])\n            go(i, remain - s[i])\n            cur.removeAt(cur.size - 1)\n        }\n    }\n    go(0, target)\n    return out.toTypedArray()\n}`,
              swift: `func combinationSum(_ candidates: [Int], _ target: Int) -> [[Int]] {\n    let s = candidates.sorted()\n    var out: [[Int]] = []\n    var cur: [Int] = []\n    func go(_ start: Int, _ remain: Int) {\n        if remain == 0 {\n            out.append(cur)\n            return\n        }\n        var i = start\n        while i < s.count {\n            if s[i] > remain { break }\n            cur.append(s[i])\n            go(i, remain - s[i])\n            cur.removeLast()\n            i += 1\n        }\n    }\n    go(0, target)\n    return out\n}`,
              rust: `fn combinationSum(candidates: Vec<i32>, target: i32) -> Vec<Vec<i32>> {\n    fn go(out: &mut Vec<Vec<i32>>, s: &Vec<i32>, start: usize, remain: i32, cur: &mut Vec<i32>) {\n        if remain == 0 {\n            out.push(cur.clone());\n            return;\n        }\n        for i in start..s.len() {\n            if s[i] > remain {\n                break;\n            }\n            cur.push(s[i]);\n            go(out, s, i, remain - s[i], cur);\n            cur.pop();\n        }\n    }\n    let mut s = candidates.clone();\n    s.sort();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    let mut cur: Vec<i32> = Vec::new();\n    go(&mut out, &s, 0, target, &mut cur);\n    out\n}`,
              php: `function combinationSum($candidates, $target) {\n    $s = $candidates;\n    sort($s);\n    $out = array();\n    combSumHelper($out, $s, 0, $target, array());\n    return $out;\n}\n\nfunction combSumHelper(&$out, $s, $start, $remain, $cur) {\n    if ($remain === 0) {\n        $out[] = $cur;\n        return;\n    }\n    $n = count($s);\n    for ($i = $start; $i < $n; $i++) {\n        if ($s[$i] > $remain) break;\n        $next = $cur;\n        $next[] = $s[$i];\n        combSumHelper($out, $s, $i, $remain - $s[$i], $next);\n    }\n}`,
              ruby: `def combinationSum(candidates, target)\n  s = candidates.sort\n  out = []\n  cur = []\n  go = lambda do |start, remain|\n    if remain == 0\n      out.push(cur.dup)\n      next\n    end\n    (start...s.length).each do |i|\n      break if s[i] > remain\n      cur.push(s[i])\n      go.call(i, remain - s[i])\n      cur.pop\n    end\n  end\n  go.call(0, target)\n  out\nend`,
      },
    };
  })(),

];
