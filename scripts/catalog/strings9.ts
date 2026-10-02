/**
 * String problems IV (mostly hard) — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Where LeetCode returns a 64-bit count, the constraints below are tightened so
 * the true answer fits in int32 (each such entry says so in its constraints).
 * Where LeetCode accepts "any order", the statement fixes one (sorted).
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const STRINGS9_PROBLEMS: CatalogProblem[] = [

  // ── Text Justification (LC 68) ──────────────────────────────────
  (() => {
    const ref = (words: string[], maxWidth: number): string[] => {
      const out: string[] = [];
      let i = 0;
      while (i < words.length) {
        let j = i, len = 0;
        while (j < words.length && len + words[j].length + (j - i) <= maxWidth) { len += words[j].length; j++; }
        const line = words.slice(i, j);
        if (j === words.length || line.length === 1) {
          const s = line.join(" ");
          out.push(s + " ".repeat(maxWidth - s.length));
        } else {
          const gaps = line.length - 1, spaces = maxWidth - len;
          let s = "";
          for (let g = 0; g < line.length; g++) {
            s += line[g];
            if (g < gaps) s += " ".repeat(Math.floor(spaces / gaps) + (g < spaces % gaps ? 1 : 0));
          }
          out.push(s);
        }
        i = j;
      }
      return out;
    };
    const VOCAB = [
      "code", "kairo", "the", "a", "streak", "is", "alive", "solve", "one", "problem", "every", "day", "and",
      "watch", "your", "rating", "climb", "practice", "makes", "progress", "duel", "friends", "in", "real",
      "time", "hunt", "bugs", "ship", "clean", "fixes", "learn", "by", "doing", "not", "just", "reading", "to",
      "be", "or", "it", "an", "I", "we", "go", "run", "test", "pass", "fail", "again", "binary", "search",
      "graph", "tree", "heap", "stack", "queue", "greedy", "dynamic", "programming", "string", "array",
      "window", "Hello", "World!", "yes.", "no,", "why?", "CodeKairo", "DSA", "x", "O(n)",
    ];
    return {
      slug: "text-justification",
      title: "Text Justification",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Simulation", "Google", "Microsoft", "Amazon", "LinkedIn"],
      signature: {
        funcName: "fullJustify",
        params: [{ name: "words", type: "string[]" as const }, { name: "maxWidth", type: "int" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "You are laying out a paragraph for a fixed-width display. Given the `words` of the paragraph (in order) and the line width `maxWidth`, return the lines of the **fully justified** text — every line exactly `maxWidth` characters long.\n\n" +
        "Fill the lines **greedily**: put as many words on a line as fit when consecutive words are separated by at least one space.\n\n" +
        "Then pad each line with spaces:\n\n" +
        "- A line that is **not** the last line and holds **two or more** words spreads its spaces between the words as evenly as possible. If the gaps cannot all be equal, the gaps further **left** get one extra space.\n" +
        "- The **last** line, and any line holding a **single** word, is left-justified: words separated by exactly one space, with the remaining spaces added at the end.\n\n" +
        "A word never contains a space, and no word is longer than `maxWidth`.",
        [
          {
            in: 'words = ["Practice","makes","progress","on","CodeKairo","every","day."], maxWidth = 16',
            out: '["Practice   makes","progress      on","CodeKairo  every","day.            "]',
            note: "Each full line gets all its spare spaces in its single gap; `day.` is the last line, so it is padded on the right.",
          },
          { in: 'words = ["a","b","c","d","e"], maxWidth = 3', out: '["a b","c d","e  "]' },
          {
            in: 'words = ["consistency","beats","talent"], maxWidth = 14',
            out: '["consistency   ","beats talent  "]',
            note: "The first line holds a single word, so it is left-justified even though it is not the last line.",
          },
        ],
        [
          "1 <= words.length <= 300",
          "1 <= words[i].length <= 20",
          "words[i] consists of English letters, digits and the symbols . , ! ? ( )",
          "1 <= maxWidth <= 100",
          "words[i].length <= maxWidth",
        ]),
      hints: [
        "Handle the paragraph one line at a time: first decide which words go on the line, then decide how to space them.",
        "Words `i..j-1` fit on a line when the sum of their lengths plus `j - i - 1` single spaces is at most `maxWidth`. Extend `j` while the next word still fits.",
        "For a middle line with `g` gaps and `S` spare spaces, every gap gets `S / g` spaces and the first `S % g` gaps get one more. The last line and single-word lines are joined with single spaces and padded on the right.",
      ],
      editorial: explain({
        idea: "The greedy rule fixes which words share a line, so the problem is pure bookkeeping: pack a line, then distribute its spaces with integer division, giving the remainder to the leftmost gaps.",
        steps: [
          "Start at word `i = 0`. Grow `j` from `i` while `len + words[j].length + (j - i) <= maxWidth`, where `len` is the total letters already on the line and `j - i` counts the single spaces needed before word `j`.",
          "Words `i..j-1` form the line. Let `gaps = j - i - 1` and `spaces = maxWidth - len`.",
          "If `j` reached the end, or `gaps == 0`, join the words with one space and pad the end with spaces up to `maxWidth`.",
          "Otherwise each gap gets `spaces / gaps` spaces, and the first `spaces % gaps` gaps get one extra.",
          "Append the line, set `i = j` and repeat until every word is placed.",
        ],
        why: "Greedy packing is what the statement prescribes, so each line's word set is forced. Within a line the spaces must total `maxWidth - len`; an even split differs by at most one between gaps, and the rule that the left gaps are larger pins down exactly which gaps get the extra space — so the output is unique and the construction produces it.",
        time: "O(total characters)",
        space: "O(maxWidth) besides the output",
        pitfalls: [
          "A single-word line in the middle of the paragraph is left-justified — dividing by zero gaps is the usual crash.",
          "The last line is left-justified even when it has several words, and it still needs trailing spaces up to `maxWidth`.",
          "When counting whether word `j` fits, include one space for every word already on the line (`j - i` of them), not `j - i - 1`.",
        ],
      }),
      examples: [
        { input: '["Practice","makes","progress","on","CodeKairo","every","day."]\n16', expectedOutput: '["Practice   makes","progress      on","CodeKairo  every","day.            "]' },
        { input: '["a","b","c","d","e"]\n3', expectedOutput: '["a b","c d","e  "]' },
        { input: '["consistency","beats","talent"]\n14', expectedOutput: '["consistency   ","beats talent  "]' },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        const n = kind === 0 ? 1 : ri(rng, 1, kind < 4 ? 6 : 16);
        const words: string[] = [];
        for (let k = 0; k < n; k++) words.push(rng() < 0.85 ? pick(rng, VOCAB) : randLower(rng, 1, 7));
        const longest = Math.max(...words.map((w) => w.length));
        const maxWidth = Math.max(longest, pick(rng, [1, 3, 5, 8, 10, 12, 16, 20, 24, 30]));
        return { input: `${fmtStrArr(words)}\n${maxWidth}`, expectedOutput: fmtStrArr(ref(words, maxWidth)) };
      },
      solutions: {
        python: code`
          from typing import List

          def fullJustify(words: List[str], maxWidth: int) -> List[str]:
              res = []
              n, i = len(words), 0
              while i < n:
                  j, length = i, 0
                  while j < n and length + len(words[j]) + (j - i) <= maxWidth:
                      length += len(words[j])
                      j += 1
                  gaps = j - i - 1
                  if j == n or gaps == 0:
                      line = " ".join(words[i:j])
                      res.append(line + " " * (maxWidth - len(line)))
                  else:
                      spaces = maxWidth - length
                      base, extra = divmod(spaces, gaps)
                      parts = []
                      for g in range(i, j):
                          parts.append(words[g])
                          if g < j - 1:
                              parts.append(" " * (base + (1 if g - i < extra else 0)))
                      res.append("".join(parts))
                  i = j
              return res
        `,
        javascript: code`
          var fullJustify = function(words, maxWidth) {
              var res = [];
              var n = words.length, i = 0;
              while (i < n) {
                  var j = i, len = 0;
                  while (j < n && len + words[j].length + (j - i) <= maxWidth) {
                      len += words[j].length;
                      j++;
                  }
                  var gaps = j - i - 1;
                  var line = "";
                  if (j === n || gaps === 0) {
                      line = words.slice(i, j).join(" ");
                      while (line.length < maxWidth) line += " ";
                  } else {
                      var spaces = maxWidth - len;
                      var base = Math.floor(spaces / gaps), extra = spaces % gaps;
                      for (var g = i; g < j; g++) {
                          line += words[g];
                          if (g < j - 1) {
                              var cnt = base + (g - i < extra ? 1 : 0);
                              for (var c = 0; c < cnt; c++) line += " ";
                          }
                      }
                  }
                  res.push(line);
                  i = j;
              }
              return res;
          };
        `,
        typescript: code`
          function fullJustify(words: string[], maxWidth: number): string[] {
              var res: string[] = [];
              var n = words.length, i = 0;
              while (i < n) {
                  var j = i, len = 0;
                  while (j < n && len + words[j].length + (j - i) <= maxWidth) {
                      len += words[j].length;
                      j++;
                  }
                  var gaps = j - i - 1;
                  var line = "";
                  if (j === n || gaps === 0) {
                      line = words.slice(i, j).join(" ");
                      while (line.length < maxWidth) line += " ";
                  } else {
                      var spaces = maxWidth - len;
                      var base = Math.floor(spaces / gaps), extra = spaces % gaps;
                      for (var g = i; g < j; g++) {
                          line += words[g];
                          if (g < j - 1) {
                              var cnt = base + (g - i < extra ? 1 : 0);
                              for (var c = 0; c < cnt; c++) line += " ";
                          }
                      }
                  }
                  res.push(line);
                  i = j;
              }
              return res;
          }
        `,
        java: code`
          public static String[] fullJustify(String[] words, int maxWidth) {
              List<String> res = new ArrayList<>();
              int n = words.length, i = 0;
              while (i < n) {
                  int j = i, len = 0;
                  while (j < n && len + words[j].length() + (j - i) <= maxWidth) {
                      len += words[j].length();
                      j++;
                  }
                  int gaps = j - i - 1;
                  StringBuilder sb = new StringBuilder();
                  if (j == n || gaps == 0) {
                      for (int g = i; g < j; g++) {
                          if (g > i) sb.append(' ');
                          sb.append(words[g]);
                      }
                      while (sb.length() < maxWidth) sb.append(' ');
                  } else {
                      int spaces = maxWidth - len, base = spaces / gaps, extra = spaces % gaps;
                      for (int g = i; g < j; g++) {
                          sb.append(words[g]);
                          if (g < j - 1) {
                              int cnt = base + (g - i < extra ? 1 : 0);
                              for (int c = 0; c < cnt; c++) sb.append(' ');
                          }
                      }
                  }
                  res.add(sb.toString());
                  i = j;
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> fullJustify(vector<string>& words, int maxWidth) {
              vector<string> res;
              int n = words.size(), i = 0;
              while (i < n) {
                  int j = i, len = 0;
                  while (j < n && len + (int)words[j].size() + (j - i) <= maxWidth) {
                      len += words[j].size();
                      j++;
                  }
                  int gaps = j - i - 1;
                  string line;
                  if (j == n || gaps == 0) {
                      for (int g = i; g < j; g++) {
                          if (g > i) line += ' ';
                          line += words[g];
                      }
                      line += string(maxWidth - (int)line.size(), ' ');
                  } else {
                      int spaces = maxWidth - len, base = spaces / gaps, extra = spaces % gaps;
                      for (int g = i; g < j; g++) {
                          line += words[g];
                          if (g < j - 1) line += string(base + (g - i < extra ? 1 : 0), ' ');
                      }
                  }
                  res.push_back(line);
                  i = j;
              }
              return res;
          }
        `,
        c: code`
          char** fullJustify(char** words, int wordsSize, int maxWidth, int* returnSize) {
              char** res = (char**)malloc(sizeof(char*) * (wordsSize + 1));
              int cnt = 0, i = 0;
              while (i < wordsSize) {
                  int j = i, len = 0;
                  while (j < wordsSize && len + (int)strlen(words[j]) + (j - i) <= maxWidth) {
                      len += (int)strlen(words[j]);
                      j++;
                  }
                  int gaps = j - i - 1;
                  char* line = (char*)malloc(maxWidth + 1);
                  int p = 0;
                  if (j == wordsSize || gaps == 0) {
                      for (int g = i; g < j; g++) {
                          if (g > i) line[p++] = ' ';
                          int L = (int)strlen(words[g]);
                          memcpy(line + p, words[g], L);
                          p += L;
                      }
                      while (p < maxWidth) line[p++] = ' ';
                  } else {
                      int spaces = maxWidth - len, base = spaces / gaps, extra = spaces % gaps;
                      for (int g = i; g < j; g++) {
                          int L = (int)strlen(words[g]);
                          memcpy(line + p, words[g], L);
                          p += L;
                          if (g < j - 1) {
                              int c = base + (g - i < extra ? 1 : 0);
                              while (c-- > 0) line[p++] = ' ';
                          }
                      }
                  }
                  line[p] = '\0';
                  res[cnt++] = line;
                  i = j;
              }
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] FullJustify(string[] words, int maxWidth)
          {
              var res = new List<string>();
              int n = words.Length, i = 0;
              while (i < n)
              {
                  int j = i, len = 0;
                  while (j < n && len + words[j].Length + (j - i) <= maxWidth)
                  {
                      len += words[j].Length;
                      j++;
                  }
                  int gaps = j - i - 1;
                  var sb = new System.Text.StringBuilder();
                  if (j == n || gaps == 0)
                  {
                      for (int g = i; g < j; g++)
                      {
                          if (g > i) sb.Append(' ');
                          sb.Append(words[g]);
                      }
                      while (sb.Length < maxWidth) sb.Append(' ');
                  }
                  else
                  {
                      int spaces = maxWidth - len, bas = spaces / gaps, extra = spaces % gaps;
                      for (int g = i; g < j; g++)
                      {
                          sb.Append(words[g]);
                          if (g < j - 1) sb.Append(' ', bas + (g - i < extra ? 1 : 0));
                      }
                  }
                  res.Add(sb.ToString());
                  i = j;
              }
              return res.ToArray();
          }
        `,
        go: code`
          func fullJustify(words []string, maxWidth int) []string {
              res := []string{}
              n, i := len(words), 0
              for i < n {
                  j, length := i, 0
                  for j < n && length+len(words[j])+(j-i) <= maxWidth {
                      length += len(words[j])
                      j++
                  }
                  gaps := j - i - 1
                  var sb strings.Builder
                  if j == n || gaps == 0 {
                      sb.WriteString(strings.Join(words[i:j], " "))
                      for sb.Len() < maxWidth {
                          sb.WriteByte(' ')
                      }
                  } else {
                      spaces := maxWidth - length
                      base, extra := spaces/gaps, spaces%gaps
                      for g := i; g < j; g++ {
                          sb.WriteString(words[g])
                          if g < j-1 {
                              c := base
                              if g-i < extra {
                                  c++
                              }
                              sb.WriteString(strings.Repeat(" ", c))
                          }
                      }
                  }
                  res = append(res, sb.String())
                  i = j
              }
              return res
          }
        `,
        kotlin: code`
          fun fullJustify(words: Array<String>, maxWidth: Int): Array<String> {
              val res = ArrayList<String>()
              val n = words.size
              var i = 0
              while (i < n) {
                  var j = i
                  var len = 0
                  while (j < n && len + words[j].length + (j - i) <= maxWidth) {
                      len += words[j].length
                      j++
                  }
                  val gaps = j - i - 1
                  val sb = StringBuilder()
                  if (j == n || gaps == 0) {
                      for (g in i until j) {
                          if (g > i) sb.append(' ')
                          sb.append(words[g])
                      }
                      while (sb.length < maxWidth) sb.append(' ')
                  } else {
                      val spaces = maxWidth - len
                      val base = spaces / gaps
                      val extra = spaces % gaps
                      for (g in i until j) {
                          sb.append(words[g])
                          if (g < j - 1) {
                              val c = base + (if (g - i < extra) 1 else 0)
                              for (q in 0 until c) sb.append(' ')
                          }
                      }
                  }
                  res.add(sb.toString())
                  i = j
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func fullJustify(_ words: [String], _ maxWidth: Int) -> [String] {
              var res: [String] = []
              let n = words.count
              var i = 0
              while i < n {
                  var j = i
                  var len = 0
                  while j < n && len + words[j].count + (j - i) <= maxWidth {
                      len += words[j].count
                      j += 1
                  }
                  let gaps = j - i - 1
                  var line = ""
                  if j == n || gaps == 0 {
                      line = words[i..<j].joined(separator: " ")
                      line += String(repeating: " ", count: maxWidth - line.count)
                  } else {
                      let spaces = maxWidth - len
                      let base = spaces / gaps
                      let extra = spaces % gaps
                      for g in i..<j {
                          line += words[g]
                          if g < j - 1 {
                              line += String(repeating: " ", count: base + (g - i < extra ? 1 : 0))
                          }
                      }
                  }
                  res.append(line)
                  i = j
              }
              return res
          }
        `,
        rust: code`
          fn fullJustify(words: Vec<String>, maxWidth: i32) -> Vec<String> {
              let w = maxWidth as usize;
              let n = words.len();
              let mut res: Vec<String> = Vec::new();
              let mut i = 0;
              while i < n {
                  let mut j = i;
                  let mut len = 0usize;
                  while j < n && len + words[j].len() + (j - i) <= w {
                      len += words[j].len();
                      j += 1;
                  }
                  let gaps = j - i - 1;
                  let mut line = String::new();
                  if j == n || gaps == 0 {
                      line.push_str(&words[i..j].join(" "));
                      while line.len() < w {
                          line.push(' ');
                      }
                  } else {
                      let spaces = w - len;
                      let base = spaces / gaps;
                      let extra = spaces % gaps;
                      for g in i..j {
                          line.push_str(&words[g]);
                          if g < j - 1 {
                              let c = base + if g - i < extra { 1 } else { 0 };
                              for _ in 0..c {
                                  line.push(' ');
                              }
                          }
                      }
                  }
                  res.push(line);
                  i = j;
              }
              res
          }
        `,
        php: code`
          function fullJustify($words, $maxWidth) {
              $res = [];
              $n = count($words);
              $i = 0;
              while ($i < $n) {
                  $j = $i;
                  $len = 0;
                  while ($j < $n && $len + strlen($words[$j]) + ($j - $i) <= $maxWidth) {
                      $len += strlen($words[$j]);
                      $j++;
                  }
                  $gaps = $j - $i - 1;
                  if ($j == $n || $gaps == 0) {
                      $line = implode(" ", array_slice($words, $i, $j - $i));
                      $line .= str_repeat(" ", $maxWidth - strlen($line));
                  } else {
                      $spaces = $maxWidth - $len;
                      $base = intdiv($spaces, $gaps);
                      $extra = $spaces % $gaps;
                      $line = "";
                      for ($g = $i; $g < $j; $g++) {
                          $line .= $words[$g];
                          if ($g < $j - 1) $line .= str_repeat(" ", $base + ($g - $i < $extra ? 1 : 0));
                      }
                  }
                  $res[] = $line;
                  $i = $j;
              }
              return $res;
          }
        `,
        ruby: code`
          def fullJustify(words, maxWidth)
            res = []
            n = words.length
            i = 0
            while i < n
              j = i
              len = 0
              while j < n && len + words[j].length + (j - i) <= maxWidth
                len += words[j].length
                j += 1
              end
              gaps = j - i - 1
              if j == n || gaps == 0
                line = words[i...j].join(" ")
                line += " " * (maxWidth - line.length)
              else
                spaces = maxWidth - len
                base = spaces / gaps
                extra = spaces % gaps
                line = ""
                (i...j).each do |g|
                  line += words[g]
                  line += " " * (base + (g - i < extra ? 1 : 0)) if g < j - 1
                end
              end
              res << line
              i = j
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Valid Number (LC 65) ────────────────────────────────────────
  (() => {
    const ref = (s: string) => /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s);
    const digits = (rng: Rng, lo: number, hi: number) => randLower(rng, lo, hi, "0123456789");
    const validNum = (rng: Rng) => {
      let s = pick(rng, ["", "", "+", "-"]);
      const form = ri(rng, 0, 3);
      if (form === 0) s += digits(rng, 1, 4);
      else if (form === 1) s += digits(rng, 1, 3) + ".";
      else if (form === 2) s += digits(rng, 1, 3) + "." + digits(rng, 1, 3);
      else s += "." + digits(rng, 1, 3);
      if (rng() < 0.45) s += pick(rng, ["e", "E"]) + pick(rng, ["", "", "+", "-"]) + digits(rng, 1, 3);
      return s;
    };
    const SOUP = "0123456789+-.eE.e+-abxEf";
    return {
      slug: "valid-number",
      title: "Valid Number",
      difficulty: "HARD" as const,
      tags: ["String", "Simulation", "Meta", "LinkedIn", "Amazon"],
      signature: { funcName: "isNumber", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A CodeKairo form field accepts numbers written in plain decimal or scientific notation. Given the text `s` typed into it, return `true` if `s` is a **valid number**.\n\n" +
        "The grammar is:\n\n" +
        "- An **integer** is an optional sign (`+` or `-`) followed by one or more digits.\n" +
        "- A **decimal** is an optional sign followed by one of: digits then a dot (`7.`), digits, a dot and digits (`7.25`), or a dot and digits (`.25`).\n" +
        "- A **valid number** is an integer or a decimal, optionally followed by an **exponent**: the letter `e` or `E` and then an integer.\n\n" +
        "Nothing else may appear — no spaces, no other letters, no second dot, and the exponent may not hold a dot.\n\n" +
        "So `\"2\"`, `\"0089\"`, `\"-0.1\"`, `\"+3.14\"`, `\"4.\"`, `\"-.9\"`, `\"2e10\"`, `\"-90E3\"`, `\"3e+7\"`, `\"+6e-1\"` and `\"53.5e93\"` are valid, while `\"abc\"`, `\"1a\"`, `\"1e\"`, `\"e3\"`, `\"99e2.5\"`, `\"--6\"`, `\"-+3\"` and `\"95a54e53\"` are not.",
        [
          { in: 's = "-12.5e+3"', out: "true", note: "A signed decimal `-12.5` followed by the exponent `e+3`." },
          { in: 's = ".e7"', out: "false", note: "The part before the exponent has no digit at all." },
          { in: 's = "6+1"', out: "false", note: "A sign may only appear at the very start or right after `e`/`E`." },
        ],
        ["1 <= s.length <= 20", "s consists of English letters, digits, '+', '-' and '.'"]),
      hints: [
        "Scan once from left to right and remember three facts: whether you have seen a digit, a dot, and an exponent marker.",
        "A sign is legal only at index 0 or immediately after `e`/`E`. A dot is legal only if no dot and no exponent came before it.",
        "An `e`/`E` is legal only once and only after at least one digit; when you see it, reset the \"seen a digit\" flag so the exponent must have its own digits. The answer is that flag at the end.",
      ],
      editorial: explain({
        idea: "The grammar is regular, so a single left-to-right scan with three flags (`digit`, `dot`, `exp`) decides it — every rule of the grammar becomes a local check on the current character.",
        steps: [
          "Set `digit = dot = exp = false`.",
          "For each character `c` at index `i`: if it is a digit, set `digit = true`.",
          "If it is `+` or `-`: it is valid only when `i == 0` or the previous character is `e`/`E`; otherwise return `false`.",
          "If it is `.`: return `false` if `dot` or `exp` is already set; otherwise set `dot = true`.",
          "If it is `e` or `E`: return `false` if `exp` is set or `digit` is not; otherwise set `exp = true` and reset `digit = false`.",
          "Any other character returns `false`. After the scan, return `digit`.",
        ],
        why: "The flags capture exactly what the grammar needs to know about the prefix read so far. Before the exponent, `digit` records whether the mantissa has at least one digit (which every decimal and integer form requires) and `dot` forbids a second dot. Resetting `digit` at the exponent forces the integer after `e` to contain a digit, while `exp` forbids a second exponent and any dot after it. Signs are only accepted at the two positions where the grammar allows them.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`\"4.\"` and `\".5\"` are valid but `\".\"` alone is not — require at least one digit in the mantissa, not on each side of the dot.",
          "Forgetting to reset the digit flag at `e` accepts `\"1e\"` and `\"1e+\"`.",
          "Library number parsers accept extras such as `Infinity`, hex or surrounding spaces — implement the grammar instead.",
        ],
      }),
      examples: [
        { input: '"-12.5e+3"', expectedOutput: "true" },
        { input: '".e7"', expectedOutput: "false" },
        { input: '"6+1"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        let s: string;
        if (kind <= 3) s = validNum(rng);
        else if (kind <= 6) {
          const base = validNum(rng).split("");
          const at = ri(rng, 0, base.length - 1);
          const op = ri(rng, 0, 2);
          const ch = SOUP[ri(rng, 0, SOUP.length - 1)];
          if (op === 0) base.splice(at, 0, ch);
          else if (op === 1 && base.length > 1) base.splice(at, 1);
          else base[at] = ch;
          s = base.join("");
        } else s = randLower(rng, 1, 7, SOUP);
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def isNumber(s: str) -> bool:
              digit = dot = exp = False
              for i, c in enumerate(s):
                  if "0" <= c <= "9":
                      digit = True
                  elif c == "+" or c == "-":
                      if i > 0 and s[i - 1] not in "eE":
                          return False
                  elif c == ".":
                      if dot or exp:
                          return False
                      dot = True
                  elif c == "e" or c == "E":
                      if exp or not digit:
                          return False
                      exp = True
                      digit = False
                  else:
                      return False
              return digit
        `,
        javascript: code`
          var isNumber = function(s) {
              var digit = false, dot = false, exp = false;
              for (var i = 0; i < s.length; i++) {
                  var c = s.charAt(i);
                  if (c >= "0" && c <= "9") {
                      digit = true;
                  } else if (c === "+" || c === "-") {
                      if (i > 0 && s.charAt(i - 1) !== "e" && s.charAt(i - 1) !== "E") return false;
                  } else if (c === ".") {
                      if (dot || exp) return false;
                      dot = true;
                  } else if (c === "e" || c === "E") {
                      if (exp || !digit) return false;
                      exp = true;
                      digit = false;
                  } else {
                      return false;
                  }
              }
              return digit;
          };
        `,
        typescript: code`
          function isNumber(s: string): boolean {
              var digit = false, dot = false, exp = false;
              for (var i = 0; i < s.length; i++) {
                  var c = s.charAt(i);
                  if (c >= "0" && c <= "9") {
                      digit = true;
                  } else if (c === "+" || c === "-") {
                      if (i > 0 && s.charAt(i - 1) !== "e" && s.charAt(i - 1) !== "E") return false;
                  } else if (c === ".") {
                      if (dot || exp) return false;
                      dot = true;
                  } else if (c === "e" || c === "E") {
                      if (exp || !digit) return false;
                      exp = true;
                      digit = false;
                  } else {
                      return false;
                  }
              }
              return digit;
          }
        `,
        java: code`
          public static boolean isNumber(String s) {
              boolean digit = false, dot = false, exp = false;
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c >= '0' && c <= '9') {
                      digit = true;
                  } else if (c == '+' || c == '-') {
                      if (i > 0 && s.charAt(i - 1) != 'e' && s.charAt(i - 1) != 'E') return false;
                  } else if (c == '.') {
                      if (dot || exp) return false;
                      dot = true;
                  } else if (c == 'e' || c == 'E') {
                      if (exp || !digit) return false;
                      exp = true;
                      digit = false;
                  } else {
                      return false;
                  }
              }
              return digit;
          }
        `,
        cpp: code`
          bool isNumber(string s) {
              bool digit = false, dot = false, exp = false;
              for (int i = 0; i < (int)s.size(); i++) {
                  char c = s[i];
                  if (c >= '0' && c <= '9') {
                      digit = true;
                  } else if (c == '+' || c == '-') {
                      if (i > 0 && s[i - 1] != 'e' && s[i - 1] != 'E') return false;
                  } else if (c == '.') {
                      if (dot || exp) return false;
                      dot = true;
                  } else if (c == 'e' || c == 'E') {
                      if (exp || !digit) return false;
                      exp = true;
                      digit = false;
                  } else {
                      return false;
                  }
              }
              return digit;
          }
        `,
        c: code`
          bool isNumber(const char* s) {
              bool digit = false, dot = false, exp = false;
              for (int i = 0; s[i] != '\0'; i++) {
                  char c = s[i];
                  if (c >= '0' && c <= '9') {
                      digit = true;
                  } else if (c == '+' || c == '-') {
                      if (i > 0 && s[i - 1] != 'e' && s[i - 1] != 'E') return false;
                  } else if (c == '.') {
                      if (dot || exp) return false;
                      dot = true;
                  } else if (c == 'e' || c == 'E') {
                      if (exp || !digit) return false;
                      exp = true;
                      digit = false;
                  } else {
                      return false;
                  }
              }
              return digit;
          }
        `,
        csharp: code`
          public static bool IsNumber(string s)
          {
              bool digit = false, dot = false, exp = false;
              for (int i = 0; i < s.Length; i++)
              {
                  char c = s[i];
                  if (c >= '0' && c <= '9')
                  {
                      digit = true;
                  }
                  else if (c == '+' || c == '-')
                  {
                      if (i > 0 && s[i - 1] != 'e' && s[i - 1] != 'E') return false;
                  }
                  else if (c == '.')
                  {
                      if (dot || exp) return false;
                      dot = true;
                  }
                  else if (c == 'e' || c == 'E')
                  {
                      if (exp || !digit) return false;
                      exp = true;
                      digit = false;
                  }
                  else
                  {
                      return false;
                  }
              }
              return digit;
          }
        `,
        go: code`
          func isNumber(s string) bool {
              digit, dot, exp := false, false, false
              for i := 0; i < len(s); i++ {
                  c := s[i]
                  if c >= '0' && c <= '9' {
                      digit = true
                  } else if c == '+' || c == '-' {
                      if i > 0 && s[i-1] != 'e' && s[i-1] != 'E' {
                          return false
                      }
                  } else if c == '.' {
                      if dot || exp {
                          return false
                      }
                      dot = true
                  } else if c == 'e' || c == 'E' {
                      if exp || !digit {
                          return false
                      }
                      exp = true
                      digit = false
                  } else {
                      return false
                  }
              }
              return digit
          }
        `,
        kotlin: code`
          fun isNumber(s: String): Boolean {
              var digit = false
              var dot = false
              var exp = false
              for (i in 0 until s.length) {
                  val c = s[i]
                  if (c in '0'..'9') {
                      digit = true
                  } else if (c == '+' || c == '-') {
                      if (i > 0 && s[i - 1] != 'e' && s[i - 1] != 'E') return false
                  } else if (c == '.') {
                      if (dot || exp) return false
                      dot = true
                  } else if (c == 'e' || c == 'E') {
                      if (exp || !digit) return false
                      exp = true
                      digit = false
                  } else {
                      return false
                  }
              }
              return digit
          }
        `,
        swift: code`
          func isNumber(_ s: String) -> Bool {
              let a = Array(s.utf8)
              var digit = false, dot = false, exp = false
              for i in 0..<a.count {
                  let c = a[i]
                  if c >= 48 && c <= 57 {
                      digit = true
                  } else if c == 43 || c == 45 {
                      if i > 0 && a[i - 1] != 101 && a[i - 1] != 69 { return false }
                  } else if c == 46 {
                      if dot || exp { return false }
                      dot = true
                  } else if c == 101 || c == 69 {
                      if exp || !digit { return false }
                      exp = true
                      digit = false
                  } else {
                      return false
                  }
              }
              return digit
          }
        `,
        rust: code`
          fn isNumber(s: String) -> bool {
              let a = s.as_bytes();
              let mut digit = false;
              let mut dot = false;
              let mut exp = false;
              for i in 0..a.len() {
                  let c = a[i];
                  if c >= b'0' && c <= b'9' {
                      digit = true;
                  } else if c == b'+' || c == b'-' {
                      if i > 0 && a[i - 1] != b'e' && a[i - 1] != b'E' {
                          return false;
                      }
                  } else if c == b'.' {
                      if dot || exp {
                          return false;
                      }
                      dot = true;
                  } else if c == b'e' || c == b'E' {
                      if exp || !digit {
                          return false;
                      }
                      exp = true;
                      digit = false;
                  } else {
                      return false;
                  }
              }
              digit
          }
        `,
        php: code`
          function isNumber($s) {
              $digit = false;
              $dot = false;
              $exp = false;
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $o = ord($s[$i]);
                  if ($o >= 48 && $o <= 57) {
                      $digit = true;
                  } elseif ($o == 43 || $o == 45) {
                      if ($i > 0 && $s[$i - 1] !== 'e' && $s[$i - 1] !== 'E') return false;
                  } elseif ($o == 46) {
                      if ($dot || $exp) return false;
                      $dot = true;
                  } elseif ($o == 101 || $o == 69) {
                      if ($exp || !$digit) return false;
                      $exp = true;
                      $digit = false;
                  } else {
                      return false;
                  }
              }
              return $digit;
          }
        `,
        ruby: code`
          def isNumber(s)
            digit = false
            dot = false
            exp = false
            s.each_char.with_index do |c, i|
              if c >= "0" && c <= "9"
                digit = true
              elsif c == "+" || c == "-"
                return false if i > 0 && s[i - 1] != "e" && s[i - 1] != "E"
              elsif c == "."
                return false if dot || exp
                dot = true
              elsif c == "e" || c == "E"
                return false if exp || !digit
                exp = true
                digit = false
              else
                return false
              end
            end
            digit
          end
        `,
      },
    };
  })(),

  // ── Integer to English Words (LC 273) ───────────────────────────
  (() => {
    const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
      "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const below1000 = (n: number): string[] => {
      const out: string[] = [];
      if (n >= 100) { out.push(ONES[Math.floor(n / 100)], "Hundred"); n %= 100; }
      if (n >= 20) { out.push(TENS[Math.floor(n / 10)]); n %= 10; }
      if (n > 0) out.push(ONES[n]);
      return out;
    };
    const ref = (num: number): string => {
      if (num === 0) return "Zero";
      const parts: string[] = [];
      const units: Array<[number, string]> = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"], [1, ""]];
      for (const [u, name] of units) {
        const g = Math.floor(num / u) % 1000;
        if (g > 0) { parts.push(...below1000(g)); if (name) parts.push(name); }
      }
      return parts.join(" ");
    };
    return {
      slug: "integer-to-english-words",
      title: "Integer to English Words",
      difficulty: "HARD" as const,
      tags: ["String", "Math", "Recursion", "Amazon", "Meta", "Microsoft", "Oracle"],
      signature: { funcName: "numberToWords", params: [{ name: "num", type: "int" as const }], returns: "string" as const },
      description: describe(
        "CodeKairo's certificate printer writes amounts out in words. Given a non-negative integer `num`, return its English name.\n\n" +
        "Use the short-scale words **Thousand**, **Million** and **Billion**, write every word with a capital first letter, separate words with single spaces, and leave out \"and\" and hyphens: `123` is `One Hundred Twenty Three`. Zero is written `Zero`; a group of three digits that is all zeros contributes nothing (`1000010` is `One Million Ten`).",
        [
          { in: "num = 2026", out: "Two Thousand Twenty Six" },
          { in: "num = 1000010", out: "One Million Ten", note: "The empty thousands group is skipped entirely." },
          { in: "num = 0", out: "Zero" },
        ],
        ["0 <= num <= 2^31 - 1"]),
      hints: [
        "Split the number into groups of three digits from the right: billions, millions, thousands and units.",
        "Every group is named the same way (a number below 1000) followed by its scale word — so write one helper for numbers below 1000.",
        "Below 1000: an optional `X Hundred`, then either a teen/unit word for 1–19 or a tens word plus an optional unit word. Skip groups that are zero, and special-case `num == 0`.",
      ],
      editorial: explain({
        idea: "English names numbers three digits at a time, so the whole task reduces to naming a number below 1000 and appending the right scale word to each non-empty group.",
        steps: [
          "If `num == 0`, return `Zero`.",
          "Keep tables for 1–19 (`One`…`Nineteen`) and for the tens (`Twenty`…`Ninety`).",
          "To name `g < 1000`: if `g >= 100` emit the hundreds digit and `Hundred`; then for the remaining `r = g % 100`, emit `TENS[r / 10]` if `r >= 20` and then the unit word if any, or the 1–19 word directly.",
          "Walk the groups from the billions down: `g = (num / scale) % 1000`. If `g > 0`, emit its name followed by the scale word (none for the units group).",
          "Join all emitted words with single spaces.",
        ],
        why: "Each group of three digits is independent in English: its name does not depend on its neighbours, only on its own digits and its scale. Skipping zero groups and zero parts (no `Zero` inside a larger number, no `Hundred` without a hundreds digit) is exactly what makes `1000010` read `One Million Ten`.",
        time: "O(1) — at most four groups",
        space: "O(1)",
        pitfalls: [
          "Emitting `Zero` for an empty group or an empty units part, or leaving double spaces where a part is missing.",
          "Numbers 10–19 are single words (`Eleven`, not `Ten One`).",
          "`Forty` is spelled without a u.",
        ],
      }),
      examples: [
        { input: "2026", expectedOutput: "Two Thousand Twenty Six" },
        { input: "1000010", expectedOutput: "One Million Ten" },
        { input: "0", expectedOutput: "Zero" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 7);
        let num: number;
        if (kind === 0) num = ri(rng, 0, 20);
        else if (kind === 1) num = ri(rng, 0, 999);
        else if (kind === 2) num = ri(rng, 0, 999999);
        else if (kind === 3) num = ri(rng, 0, 2147483647);
        else if (kind === 4) num = pick(rng, [2147483647, 1000000000, 1000000, 1000, 100, 2000000000, 1000001, 1001000, 1000000001]);
        else {
          const grp = () => (rng() < 0.4 ? 0 : pick(rng, [ri(rng, 1, 19), ri(rng, 20, 99), ri(rng, 100, 999), 100 * ri(rng, 1, 9), 10 * ri(rng, 2, 9)]));
          num = ri(rng, 0, 2) * 1e9 + grp() * 1e6 + grp() * 1e3 + grp();
          if (num > 2147483647) num = num % 2000000000;
        }
        return { input: String(num), expectedOutput: ref(num) };
      },
      solutions: {
        python: code`
          ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
                  "Eighteen", "Nineteen"]
          TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
          SCALES = ["", "Thousand", "Million", "Billion"]

          def numberToWords(num: int) -> str:
              if num == 0:
                  return "Zero"
              groups = []
              while num > 0:
                  groups.append(num % 1000)
                  num //= 1000
              words = []
              for g in range(len(groups) - 1, -1, -1):
                  if groups[g]:
                      _name_below_1000(groups[g], words)
                      if SCALES[g]:
                          words.append(SCALES[g])
              return " ".join(words)

          def _name_below_1000(n, out):
              if n >= 100:
                  out.append(ONES[n // 100])
                  out.append("Hundred")
                  n %= 100
              if n >= 20:
                  out.append(TENS[n // 10])
                  n %= 10
              if n > 0:
                  out.append(ONES[n])
        `,
        javascript: code`
          var NW_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
          var NW_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
          var NW_SCALES = ["", "Thousand", "Million", "Billion"];

          function nwBelow1000(n, out) {
              if (n >= 100) {
                  out.push(NW_ONES[Math.floor(n / 100)], "Hundred");
                  n %= 100;
              }
              if (n >= 20) {
                  out.push(NW_TENS[Math.floor(n / 10)]);
                  n %= 10;
              }
              if (n > 0) out.push(NW_ONES[n]);
          }

          var numberToWords = function(num) {
              if (num === 0) return "Zero";
              var groups = [];
              while (num > 0) {
                  groups.push(num % 1000);
                  num = Math.floor(num / 1000);
              }
              var words = [];
              for (var g = groups.length - 1; g >= 0; g--) {
                  if (groups[g] > 0) {
                      nwBelow1000(groups[g], words);
                      if (g > 0) words.push(NW_SCALES[g]);
                  }
              }
              return words.join(" ");
          };
        `,
        typescript: code`
          var NW_ONES: string[] = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
          var NW_TENS: string[] = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
          var NW_SCALES: string[] = ["", "Thousand", "Million", "Billion"];

          function nwBelow1000(n: number, out: string[]): void {
              if (n >= 100) {
                  out.push(NW_ONES[Math.floor(n / 100)], "Hundred");
                  n %= 100;
              }
              if (n >= 20) {
                  out.push(NW_TENS[Math.floor(n / 10)]);
                  n %= 10;
              }
              if (n > 0) out.push(NW_ONES[n]);
          }

          function numberToWords(num: number): string {
              if (num === 0) return "Zero";
              var groups: number[] = [];
              while (num > 0) {
                  groups.push(num % 1000);
                  num = Math.floor(num / 1000);
              }
              var words: string[] = [];
              for (var g = groups.length - 1; g >= 0; g--) {
                  if (groups[g] > 0) {
                      nwBelow1000(groups[g], words);
                      if (g > 0) words.push(NW_SCALES[g]);
                  }
              }
              return words.join(" ");
          }
        `,
        java: code`
          static final String[] NW_ONES = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
          static final String[] NW_TENS = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
          static final String[] NW_SCALES = {"", "Thousand", "Million", "Billion"};

          static void nwBelow1000(int n, List<String> out) {
              if (n >= 100) {
                  out.add(NW_ONES[n / 100]);
                  out.add("Hundred");
                  n %= 100;
              }
              if (n >= 20) {
                  out.add(NW_TENS[n / 10]);
                  n %= 10;
              }
              if (n > 0) out.add(NW_ONES[n]);
          }

          public static String numberToWords(int num) {
              if (num == 0) return "Zero";
              int[] groups = new int[4];
              int cnt = 0;
              while (num > 0) {
                  groups[cnt++] = num % 1000;
                  num /= 1000;
              }
              List<String> words = new ArrayList<>();
              for (int g = cnt - 1; g >= 0; g--) {
                  if (groups[g] > 0) {
                      nwBelow1000(groups[g], words);
                      if (g > 0) words.add(NW_SCALES[g]);
                  }
              }
              return String.join(" ", words);
          }
        `,
        cpp: code`
          static const char* NW_ONES[] = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
          static const char* NW_TENS[] = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
          static const char* NW_SCALES[] = {"", "Thousand", "Million", "Billion"};

          static void nwBelow1000(int n, vector<string>& out) {
              if (n >= 100) {
                  out.push_back(NW_ONES[n / 100]);
                  out.push_back("Hundred");
                  n %= 100;
              }
              if (n >= 20) {
                  out.push_back(NW_TENS[n / 10]);
                  n %= 10;
              }
              if (n > 0) out.push_back(NW_ONES[n]);
          }

          string numberToWords(int num) {
              if (num == 0) return "Zero";
              int groups[4];
              int cnt = 0;
              while (num > 0) {
                  groups[cnt++] = num % 1000;
                  num /= 1000;
              }
              vector<string> words;
              for (int g = cnt - 1; g >= 0; g--) {
                  if (groups[g] > 0) {
                      nwBelow1000(groups[g], words);
                      if (g > 0) words.push_back(NW_SCALES[g]);
                  }
              }
              string res;
              for (size_t i = 0; i < words.size(); i++) {
                  if (i) res += ' ';
                  res += words[i];
              }
              return res;
          }
        `,
        c: code`
          static const char* NW_ONES[] = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
          static const char* NW_TENS[] = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
          static const char* NW_SCALES[] = {"", "Thousand", "Million", "Billion"};

          static void nwAdd(char* buf, const char* w) {
              if (buf[0] != '\0') strcat(buf, " ");
              strcat(buf, w);
          }

          static void nwBelow1000(char* buf, int n) {
              if (n >= 100) {
                  nwAdd(buf, NW_ONES[n / 100]);
                  nwAdd(buf, "Hundred");
                  n %= 100;
              }
              if (n >= 20) {
                  nwAdd(buf, NW_TENS[n / 10]);
                  n %= 10;
              }
              if (n > 0) nwAdd(buf, NW_ONES[n]);
          }

          char* numberToWords(int num) {
              char* buf = (char*)malloc(256);
              buf[0] = '\0';
              if (num == 0) {
                  strcpy(buf, "Zero");
                  return buf;
              }
              int groups[4];
              int cnt = 0;
              while (num > 0) {
                  groups[cnt++] = num % 1000;
                  num /= 1000;
              }
              for (int g = cnt - 1; g >= 0; g--) {
                  if (groups[g] > 0) {
                      nwBelow1000(buf, groups[g]);
                      if (g > 0) nwAdd(buf, NW_SCALES[g]);
                  }
              }
              return buf;
          }
        `,
        csharp: code`
          static readonly string[] NwOnes = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
          static readonly string[] NwTens = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
          static readonly string[] NwScales = {"", "Thousand", "Million", "Billion"};

          static void NwBelow1000(int n, List<string> words)
          {
              if (n >= 100)
              {
                  words.Add(NwOnes[n / 100]);
                  words.Add("Hundred");
                  n %= 100;
              }
              if (n >= 20)
              {
                  words.Add(NwTens[n / 10]);
                  n %= 10;
              }
              if (n > 0) words.Add(NwOnes[n]);
          }

          public static string NumberToWords(int num)
          {
              if (num == 0) return "Zero";
              var groups = new int[4];
              int cnt = 0;
              while (num > 0)
              {
                  groups[cnt++] = num % 1000;
                  num /= 1000;
              }
              var words = new List<string>();
              for (int g = cnt - 1; g >= 0; g--)
              {
                  if (groups[g] > 0)
                  {
                      NwBelow1000(groups[g], words);
                      if (g > 0) words.Add(NwScales[g]);
                  }
              }
              return string.Join(" ", words);
          }
        `,
        go: code`
          var nwOnes = []string{"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"}
          var nwTens = []string{"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"}
          var nwScales = []string{"", "Thousand", "Million", "Billion"}

          func nwBelow1000(n int, words []string) []string {
              if n >= 100 {
                  words = append(words, nwOnes[n/100], "Hundred")
                  n %= 100
              }
              if n >= 20 {
                  words = append(words, nwTens[n/10])
                  n %= 10
              }
              if n > 0 {
                  words = append(words, nwOnes[n])
              }
              return words
          }

          func numberToWords(num int) string {
              if num == 0 {
                  return "Zero"
              }
              groups := []int{}
              for num > 0 {
                  groups = append(groups, num%1000)
                  num /= 1000
              }
              words := []string{}
              for g := len(groups) - 1; g >= 0; g-- {
                  if groups[g] > 0 {
                      words = nwBelow1000(groups[g], words)
                      if g > 0 {
                          words = append(words, nwScales[g])
                      }
                  }
              }
              return strings.Join(words, " ")
          }
        `,
        kotlin: code`
          val NW_ONES = arrayOf("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen")
          val NW_TENS = arrayOf("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety")
          val NW_SCALES = arrayOf("", "Thousand", "Million", "Billion")

          fun nwBelow1000(num: Int, words: MutableList<String>) {
              var n = num
              if (n >= 100) {
                  words.add(NW_ONES[n / 100])
                  words.add("Hundred")
                  n %= 100
              }
              if (n >= 20) {
                  words.add(NW_TENS[n / 10])
                  n %= 10
              }
              if (n > 0) words.add(NW_ONES[n])
          }

          fun numberToWords(num: Int): String {
              if (num == 0) return "Zero"
              val groups = ArrayList<Int>()
              var x = num
              while (x > 0) {
                  groups.add(x % 1000)
                  x /= 1000
              }
              val words = ArrayList<String>()
              for (g in groups.size - 1 downTo 0) {
                  if (groups[g] > 0) {
                      nwBelow1000(groups[g], words)
                      if (g > 0) words.add(NW_SCALES[g])
                  }
              }
              return words.joinToString(" ")
          }
        `,
        swift: code`
          let nwOnes = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
          let nwTens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
          let nwScales = ["", "Thousand", "Million", "Billion"]

          func nwBelow1000(_ num: Int, _ words: inout [String]) {
              var n = num
              if n >= 100 {
                  words.append(nwOnes[n / 100])
                  words.append("Hundred")
                  n %= 100
              }
              if n >= 20 {
                  words.append(nwTens[n / 10])
                  n %= 10
              }
              if n > 0 { words.append(nwOnes[n]) }
          }

          func numberToWords(_ num: Int) -> String {
              if num == 0 { return "Zero" }
              var groups: [Int] = []
              var x = num
              while x > 0 {
                  groups.append(x % 1000)
                  x /= 1000
              }
              var words: [String] = []
              var g = groups.count - 1
              while g >= 0 {
                  if groups[g] > 0 {
                      nwBelow1000(groups[g], &words)
                      if g > 0 { words.append(nwScales[g]) }
                  }
                  g -= 1
              }
              return words.joined(separator: " ")
          }
        `,
        rust: code`
          const NW_ONES: [&str; 20] = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
              "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
          const NW_TENS: [&str; 10] = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
          const NW_SCALES: [&str; 4] = ["", "Thousand", "Million", "Billion"];

          fn nw_below_1000(num: usize, words: &mut Vec<String>) {
              let mut n = num;
              if n >= 100 {
                  words.push(NW_ONES[n / 100].to_string());
                  words.push("Hundred".to_string());
                  n %= 100;
              }
              if n >= 20 {
                  words.push(NW_TENS[n / 10].to_string());
                  n %= 10;
              }
              if n > 0 {
                  words.push(NW_ONES[n].to_string());
              }
          }

          fn numberToWords(num: i32) -> String {
              if num == 0 {
                  return "Zero".to_string();
              }
              let mut groups: Vec<usize> = Vec::new();
              let mut x = num as usize;
              while x > 0 {
                  groups.push(x % 1000);
                  x /= 1000;
              }
              let mut words: Vec<String> = Vec::new();
              for g in (0..groups.len()).rev() {
                  if groups[g] > 0 {
                      nw_below_1000(groups[g], &mut words);
                      if g > 0 {
                          words.push(NW_SCALES[g].to_string());
                      }
                  }
              }
              words.join(" ")
          }
        `,
        php: code`
          function nwBelow1000($n, &$words) {
              $ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
              $tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
              if ($n >= 100) {
                  $words[] = $ones[intdiv($n, 100)];
                  $words[] = "Hundred";
                  $n %= 100;
              }
              if ($n >= 20) {
                  $words[] = $tens[intdiv($n, 10)];
                  $n %= 10;
              }
              if ($n > 0) $words[] = $ones[$n];
          }

          function numberToWords($num) {
              if ($num == 0) return "Zero";
              $scales = ["", "Thousand", "Million", "Billion"];
              $groups = [];
              while ($num > 0) {
                  $groups[] = $num % 1000;
                  $num = intdiv($num, 1000);
              }
              $words = [];
              for ($g = count($groups) - 1; $g >= 0; $g--) {
                  if ($groups[$g] > 0) {
                      nwBelow1000($groups[$g], $words);
                      if ($g > 0) $words[] = $scales[$g];
                  }
              }
              return implode(" ", $words);
          }
        `,
        ruby: code`
          NW_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                     "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
          NW_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
          NW_SCALES = ["", "Thousand", "Million", "Billion"]

          def nw_below_1000(n, words)
            if n >= 100
              words << NW_ONES[n / 100]
              words << "Hundred"
              n %= 100
            end
            if n >= 20
              words << NW_TENS[n / 10]
              n %= 10
            end
            words << NW_ONES[n] if n > 0
          end

          def numberToWords(num)
            return "Zero" if num == 0
            groups = []
            while num > 0
              groups << num % 1000
              num /= 1000
            end
            words = []
            (groups.length - 1).downto(0) do |g|
              next if groups[g] == 0
              nw_below_1000(groups[g], words)
              words << NW_SCALES[g] if g > 0
            end
            words.join(" ")
          end
        `,
      },
    };
  })(),

  // ── Remove Invalid Parentheses (LC 301) ─────────────────────────
  (() => {
    const balanced = (s: string) => {
      let bal = 0;
      for (const c of s) {
        if (c === "(") bal++;
        else if (c === ")") { bal--; if (bal < 0) return false; }
      }
      return bal === 0;
    };
    // Level-by-level BFS: remove one parenthesis at a time, stop at the first
    // level that holds a balanced string — independent of the DFS solutions.
    const ref = (s: string): string[] => {
      let level = new Set<string>([s]);
      for (;;) {
        const ok = [...level].filter(balanced);
        if (ok.length) return ok.sort();
        const next = new Set<string>();
        for (const t of level) {
          for (let i = 0; i < t.length; i++) if (t[i] === "(" || t[i] === ")") next.add(t.slice(0, i) + t.slice(i + 1));
        }
        level = next;
      }
    };
    return {
      slug: "remove-invalid-parentheses",
      title: "Remove Invalid Parentheses",
      difficulty: "HARD" as const,
      tags: ["String", "Backtracking", "Breadth-First Search", "Meta", "Amazon", "Google"],
      signature: { funcName: "removeInvalidParentheses", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "A string `s` holds lowercase letters and the brackets `(` and `)`. It is **valid** when its brackets are balanced: reading left to right, no `)` ever appears without an unmatched `(` before it, and every `(` is matched by the end. Letters are ignored.\n\n" +
        "Delete the **minimum** number of brackets so that the string becomes valid, and return **every distinct** valid string you can reach with that minimum number of deletions.\n\n" +
        "Return the strings **sorted in ascending lexicographic order** (by character code, so `(` < `)` < letters). If the only option is to delete every bracket and nothing is left, the answer is `[\"\"]`.",
        [
          { in: 's = "(c)o)d(e)"', out: '["(c)od(e)","(co)d(e)"]', note: "One `)` is surplus; deleting either of the first two gives a valid string." },
          { in: 's = "))("', out: '[""]' },
          { in: 's = "x(()"', out: '["x()"]', note: "Deleting either `(` produces the same string, which is listed once." },
        ],
        ["1 <= s.length <= 25", "s consists of lowercase English letters and '(' and ')'", "There are at most 20 brackets in s"]),
      hints: [
        "One left-to-right pass tells you how many `(` and how many `)` must be deleted: count the `)` that have no partner, and the `(` still open at the end.",
        "Search over the string with those two budgets: at each bracket either delete it (if its budget allows) or keep it, tracking how many `(` are currently open.",
        "Never keep a `)` when nothing is open, and accept a finished string only when both budgets are spent and nothing is open. Collect results in a set to remove duplicates, then sort.",
      ],
      editorial: explain({
        idea: "The minimum number of deletions is known in advance — a balance scan counts the unmatched `)` and the leftover `(` — so a depth-first search that spends exactly those budgets enumerates precisely the optimal strings.",
        steps: [
          "Scan `s` with a counter: `(` increments it; `)` decrements it if positive, otherwise increments `right` (an unmatched `)`). At the end the counter is `left`, the unmatched `(`.",
          "DFS over positions `i` with state `(open, left, right)` and the string built so far.",
          "At a letter, keep it. At `(`: if `left > 0`, branch on deleting it; also branch on keeping it (`open + 1`).",
          "At `)`: if `right > 0`, branch on deleting it; if `open > 0`, branch on keeping it (`open - 1`).",
          "At the end, record the built string if `open == left == right == 0`.",
          "Deduplicate with a set and sort the result.",
        ],
        why: "No valid string can be reached with fewer than `left + right` deletions: every unmatched `)` found by the scan needs a `(` before it that does not exist, and every leftover `(` needs a later `)`. Conversely, the search keeps the running balance non-negative and requires it to end at zero, so every recorded string is valid, and it only records strings that used exactly the minimum budgets. Every optimal deletion set is one path of the search, so nothing is missed.",
        time: "O(2^b · n) in the worst case for b brackets, far less in practice because the budgets prune most branches",
        space: "O(n) recursion depth plus the output",
        pitfalls: [
          "Different deletion sets can yield the same string (`\"x(()\"` → `\"x()\"` twice) — deduplicate.",
          "Deleting more than the minimum also gives valid strings; they must not be reported.",
          "When the answer is to delete every bracket of a letter-free string, the result is a list holding the empty string, not an empty list.",
        ],
      }),
      examples: [
        { input: '"(c)o)d(e)"', expectedOutput: '["(c)od(e)","(co)d(e)"]' },
        { input: '"))("', expectedOutput: '[""]' },
        { input: '"x(()"', expectedOutput: '["x()"]' },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 16);
        const pParen = pick(rng, [0.5, 0.7, 0.85, 1]);
        let parens = 0;
        let s = "";
        for (let i = 0; i < n; i++) {
          if (rng() < pParen && parens < 12) { s += rng() < 0.5 ? "(" : ")"; parens++; }
          else s += pick(rng, ["a", "b", "x"]);
        }
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def removeInvalidParentheses(s: str) -> List[str]:
              left = right = 0
              for c in s:
                  if c == "(":
                      left += 1
                  elif c == ")":
                      if left > 0:
                          left -= 1
                      else:
                          right += 1
              n = len(s)
              found = set()
              buf = []

              def dfs(i, opened, l, r):
                  if i == n:
                      if l == 0 and r == 0 and opened == 0:
                          found.add("".join(buf))
                      return
                  c = s[i]
                  if c == "(":
                      if l > 0:
                          dfs(i + 1, opened, l - 1, r)
                      buf.append(c)
                      dfs(i + 1, opened + 1, l, r)
                      buf.pop()
                  elif c == ")":
                      if r > 0:
                          dfs(i + 1, opened, l, r - 1)
                      if opened > 0:
                          buf.append(c)
                          dfs(i + 1, opened - 1, l, r)
                          buf.pop()
                  else:
                      buf.append(c)
                      dfs(i + 1, opened, l, r)
                      buf.pop()

              dfs(0, 0, left, right)
              return sorted(found)
        `,
        javascript: code`
          var removeInvalidParentheses = function(s) {
              var left = 0, right = 0;
              for (var i = 0; i < s.length; i++) {
                  if (s[i] === "(") left++;
                  else if (s[i] === ")") {
                      if (left > 0) left--;
                      else right++;
                  }
              }
              var n = s.length;
              var found = new Set();
              var dfs = function(i, opened, l, r, cur) {
                  if (i === n) {
                      if (l === 0 && r === 0 && opened === 0) found.add(cur);
                      return;
                  }
                  var c = s[i];
                  if (c === "(") {
                      if (l > 0) dfs(i + 1, opened, l - 1, r, cur);
                      dfs(i + 1, opened + 1, l, r, cur + c);
                  } else if (c === ")") {
                      if (r > 0) dfs(i + 1, opened, l, r - 1, cur);
                      if (opened > 0) dfs(i + 1, opened - 1, l, r, cur + c);
                  } else {
                      dfs(i + 1, opened, l, r, cur + c);
                  }
              };
              dfs(0, 0, left, right, "");
              return Array.from(found).sort();
          };
        `,
        typescript: code`
          function removeInvalidParentheses(s: string): string[] {
              var left = 0, right = 0;
              for (var i = 0; i < s.length; i++) {
                  var ch = s.charAt(i);
                  if (ch === "(") left++;
                  else if (ch === ")") {
                      if (left > 0) left--;
                      else right++;
                  }
              }
              var n = s.length;
              var found: { [k: string]: boolean } = {};
              var dfs = function(i: number, opened: number, l: number, r: number, cur: string): void {
                  if (i === n) {
                      if (l === 0 && r === 0 && opened === 0) found["#" + cur] = true;
                      return;
                  }
                  var c = s.charAt(i);
                  if (c === "(") {
                      if (l > 0) dfs(i + 1, opened, l - 1, r, cur);
                      dfs(i + 1, opened + 1, l, r, cur + c);
                  } else if (c === ")") {
                      if (r > 0) dfs(i + 1, opened, l, r - 1, cur);
                      if (opened > 0) dfs(i + 1, opened - 1, l, r, cur + c);
                  } else {
                      dfs(i + 1, opened, l, r, cur + c);
                  }
              };
              dfs(0, 0, left, right, "");
              var res: string[] = [];
              for (var key in found) {
                  if (found.hasOwnProperty(key)) res.push(key.substring(1));
              }
              res.sort();
              return res;
          }
        `,
        java: code`
          static void ripDfs(String s, int i, int opened, int l, int r, StringBuilder cur, TreeSet<String> found) {
              if (i == s.length()) {
                  if (l == 0 && r == 0 && opened == 0) found.add(cur.toString());
                  return;
              }
              char c = s.charAt(i);
              if (c == '(') {
                  if (l > 0) ripDfs(s, i + 1, opened, l - 1, r, cur, found);
                  cur.append(c);
                  ripDfs(s, i + 1, opened + 1, l, r, cur, found);
                  cur.setLength(cur.length() - 1);
              } else if (c == ')') {
                  if (r > 0) ripDfs(s, i + 1, opened, l, r - 1, cur, found);
                  if (opened > 0) {
                      cur.append(c);
                      ripDfs(s, i + 1, opened - 1, l, r, cur, found);
                      cur.setLength(cur.length() - 1);
                  }
              } else {
                  cur.append(c);
                  ripDfs(s, i + 1, opened, l, r, cur, found);
                  cur.setLength(cur.length() - 1);
              }
          }

          public static String[] removeInvalidParentheses(String s) {
              int left = 0, right = 0;
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c == '(') left++;
                  else if (c == ')') {
                      if (left > 0) left--;
                      else right++;
                  }
              }
              TreeSet<String> found = new TreeSet<>();
              ripDfs(s, 0, 0, left, right, new StringBuilder(), found);
              return found.toArray(new String[0]);
          }
        `,
        cpp: code`
          static void ripDfs(const string& s, int i, int opened, int l, int r, string& cur, set<string>& found) {
              if (i == (int)s.size()) {
                  if (l == 0 && r == 0 && opened == 0) found.insert(cur);
                  return;
              }
              char c = s[i];
              if (c == '(') {
                  if (l > 0) ripDfs(s, i + 1, opened, l - 1, r, cur, found);
                  cur.push_back(c);
                  ripDfs(s, i + 1, opened + 1, l, r, cur, found);
                  cur.pop_back();
              } else if (c == ')') {
                  if (r > 0) ripDfs(s, i + 1, opened, l, r - 1, cur, found);
                  if (opened > 0) {
                      cur.push_back(c);
                      ripDfs(s, i + 1, opened - 1, l, r, cur, found);
                      cur.pop_back();
                  }
              } else {
                  cur.push_back(c);
                  ripDfs(s, i + 1, opened, l, r, cur, found);
                  cur.pop_back();
              }
          }

          vector<string> removeInvalidParentheses(string s) {
              int left = 0, right = 0;
              for (char c : s) {
                  if (c == '(') left++;
                  else if (c == ')') {
                      if (left > 0) left--;
                      else right++;
                  }
              }
              set<string> found;
              string cur;
              ripDfs(s, 0, 0, left, right, cur, found);
              return vector<string>(found.begin(), found.end());
          }
        `,
        c: code`
          static char** ripRes;
          static int ripCnt, ripCap;
          static char ripBuf[64];
          static const char* ripS;
          static int ripN;

          static void ripDfs(int i, int len, int opened, int l, int r) {
              if (i == ripN) {
                  if (l == 0 && r == 0 && opened == 0) {
                      if (ripCnt == ripCap) {
                          ripCap = ripCap ? ripCap * 2 : 16;
                          ripRes = (char**)realloc(ripRes, sizeof(char*) * ripCap);
                      }
                      char* t = (char*)malloc(len + 1);
                      memcpy(t, ripBuf, len);
                      t[len] = '\0';
                      ripRes[ripCnt++] = t;
                  }
                  return;
              }
              char c = ripS[i];
              if (c == '(') {
                  if (l > 0) ripDfs(i + 1, len, opened, l - 1, r);
                  ripBuf[len] = c;
                  ripDfs(i + 1, len + 1, opened + 1, l, r);
              } else if (c == ')') {
                  if (r > 0) ripDfs(i + 1, len, opened, l, r - 1);
                  if (opened > 0) {
                      ripBuf[len] = c;
                      ripDfs(i + 1, len + 1, opened - 1, l, r);
                  }
              } else {
                  ripBuf[len] = c;
                  ripDfs(i + 1, len + 1, opened, l, r);
              }
          }

          static int ripCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** removeInvalidParentheses(const char* s, int* returnSize) {
              ripS = s;
              ripN = (int)strlen(s);
              ripRes = NULL;
              ripCnt = 0;
              ripCap = 0;
              int left = 0, right = 0;
              for (int i = 0; i < ripN; i++) {
                  if (s[i] == '(') left++;
                  else if (s[i] == ')') {
                      if (left > 0) left--;
                      else right++;
                  }
              }
              ripDfs(0, 0, 0, left, right);
              qsort(ripRes, ripCnt, sizeof(char*), ripCmp);
              int m = 0;
              for (int i = 0; i < ripCnt; i++) {
                  if (m == 0 || strcmp(ripRes[m - 1], ripRes[i]) != 0) ripRes[m++] = ripRes[i];
              }
              *returnSize = m;
              return ripRes;
          }
        `,
        csharp: code`
          static void RipDfs(string s, int i, int opened, int l, int r, System.Text.StringBuilder cur, HashSet<string> found)
          {
              if (i == s.Length)
              {
                  if (l == 0 && r == 0 && opened == 0) found.Add(cur.ToString());
                  return;
              }
              char c = s[i];
              if (c == '(')
              {
                  if (l > 0) RipDfs(s, i + 1, opened, l - 1, r, cur, found);
                  cur.Append(c);
                  RipDfs(s, i + 1, opened + 1, l, r, cur, found);
                  cur.Length--;
              }
              else if (c == ')')
              {
                  if (r > 0) RipDfs(s, i + 1, opened, l, r - 1, cur, found);
                  if (opened > 0)
                  {
                      cur.Append(c);
                      RipDfs(s, i + 1, opened - 1, l, r, cur, found);
                      cur.Length--;
                  }
              }
              else
              {
                  cur.Append(c);
                  RipDfs(s, i + 1, opened, l, r, cur, found);
                  cur.Length--;
              }
          }

          public static string[] RemoveInvalidParentheses(string s)
          {
              int left = 0, right = 0;
              foreach (char c in s)
              {
                  if (c == '(') left++;
                  else if (c == ')')
                  {
                      if (left > 0) left--;
                      else right++;
                  }
              }
              var found = new HashSet<string>();
              RipDfs(s, 0, 0, left, right, new System.Text.StringBuilder(), found);
              var res = new List<string>(found);
              res.Sort(string.CompareOrdinal);
              return res.ToArray();
          }
        `,
        go: code`
          func ripDfs(s string, i, opened, l, r int, cur []byte, found map[string]bool) {
              if i == len(s) {
                  if l == 0 && r == 0 && opened == 0 {
                      found[string(cur)] = true
                  }
                  return
              }
              c := s[i]
              if c == '(' {
                  if l > 0 {
                      ripDfs(s, i+1, opened, l-1, r, cur, found)
                  }
                  ripDfs(s, i+1, opened+1, l, r, append(cur, c), found)
              } else if c == ')' {
                  if r > 0 {
                      ripDfs(s, i+1, opened, l, r-1, cur, found)
                  }
                  if opened > 0 {
                      ripDfs(s, i+1, opened-1, l, r, append(cur, c), found)
                  }
              } else {
                  ripDfs(s, i+1, opened, l, r, append(cur, c), found)
              }
          }

          func removeInvalidParentheses(s string) []string {
              left, right := 0, 0
              for i := 0; i < len(s); i++ {
                  if s[i] == '(' {
                      left++
                  } else if s[i] == ')' {
                      if left > 0 {
                          left--
                      } else {
                          right++
                      }
                  }
              }
              found := map[string]bool{}
              ripDfs(s, 0, 0, left, right, make([]byte, 0, len(s)), found)
              res := make([]string, 0, len(found))
              for k := range found {
                  res = append(res, k)
              }
              sort.Strings(res)
              return res
          }
        `,
        kotlin: code`
          fun ripDfs(s: String, i: Int, opened: Int, l: Int, r: Int, cur: StringBuilder, found: java.util.TreeSet<String>) {
              if (i == s.length) {
                  if (l == 0 && r == 0 && opened == 0) found.add(cur.toString())
                  return
              }
              val c = s[i]
              if (c == '(') {
                  if (l > 0) ripDfs(s, i + 1, opened, l - 1, r, cur, found)
                  cur.append(c)
                  ripDfs(s, i + 1, opened + 1, l, r, cur, found)
                  cur.setLength(cur.length - 1)
              } else if (c == ')') {
                  if (r > 0) ripDfs(s, i + 1, opened, l, r - 1, cur, found)
                  if (opened > 0) {
                      cur.append(c)
                      ripDfs(s, i + 1, opened - 1, l, r, cur, found)
                      cur.setLength(cur.length - 1)
                  }
              } else {
                  cur.append(c)
                  ripDfs(s, i + 1, opened, l, r, cur, found)
                  cur.setLength(cur.length - 1)
              }
          }

          fun removeInvalidParentheses(s: String): Array<String> {
              var left = 0
              var right = 0
              for (c in s) {
                  if (c == '(') left++
                  else if (c == ')') {
                      if (left > 0) left-- else right++
                  }
              }
              val found = java.util.TreeSet<String>()
              ripDfs(s, 0, 0, left, right, StringBuilder(), found)
              return found.toTypedArray()
          }
        `,
        swift: code`
          func ripDfs(_ s: [Character], _ i: Int, _ opened: Int, _ l: Int, _ r: Int, _ cur: inout [Character], _ found: inout Set<String>) {
              if i == s.count {
                  if l == 0 && r == 0 && opened == 0 { found.insert(String(cur)) }
                  return
              }
              let c = s[i]
              if c == "(" {
                  if l > 0 { ripDfs(s, i + 1, opened, l - 1, r, &cur, &found) }
                  cur.append(c)
                  ripDfs(s, i + 1, opened + 1, l, r, &cur, &found)
                  cur.removeLast()
              } else if c == ")" {
                  if r > 0 { ripDfs(s, i + 1, opened, l, r - 1, &cur, &found) }
                  if opened > 0 {
                      cur.append(c)
                      ripDfs(s, i + 1, opened - 1, l, r, &cur, &found)
                      cur.removeLast()
                  }
              } else {
                  cur.append(c)
                  ripDfs(s, i + 1, opened, l, r, &cur, &found)
                  cur.removeLast()
              }
          }

          func removeInvalidParentheses(_ s: String) -> [String] {
              let a = Array(s)
              var left = 0, right = 0
              for c in a {
                  if c == "(" {
                      left += 1
                  } else if c == ")" {
                      if left > 0 { left -= 1 } else { right += 1 }
                  }
              }
              var found = Set<String>()
              var cur: [Character] = []
              ripDfs(a, 0, 0, left, right, &cur, &found)
              return found.sorted()
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          fn rip_dfs(s: &[u8], i: usize, opened: i32, l: i32, r: i32, cur: &mut Vec<u8>, found: &mut BTreeSet<String>) {
              if i == s.len() {
                  if l == 0 && r == 0 && opened == 0 {
                      found.insert(String::from_utf8(cur.clone()).unwrap());
                  }
                  return;
              }
              let c = s[i];
              if c == b'(' {
                  if l > 0 {
                      rip_dfs(s, i + 1, opened, l - 1, r, cur, found);
                  }
                  cur.push(c);
                  rip_dfs(s, i + 1, opened + 1, l, r, cur, found);
                  cur.pop();
              } else if c == b')' {
                  if r > 0 {
                      rip_dfs(s, i + 1, opened, l, r - 1, cur, found);
                  }
                  if opened > 0 {
                      cur.push(c);
                      rip_dfs(s, i + 1, opened - 1, l, r, cur, found);
                      cur.pop();
                  }
              } else {
                  cur.push(c);
                  rip_dfs(s, i + 1, opened, l, r, cur, found);
                  cur.pop();
              }
          }

          fn removeInvalidParentheses(s: String) -> Vec<String> {
              let b = s.as_bytes();
              let mut left = 0;
              let mut right = 0;
              for &c in b.iter() {
                  if c == b'(' {
                      left += 1;
                  } else if c == b')' {
                      if left > 0 {
                          left -= 1;
                      } else {
                          right += 1;
                      }
                  }
              }
              let mut found: BTreeSet<String> = BTreeSet::new();
              let mut cur: Vec<u8> = Vec::new();
              rip_dfs(b, 0, 0, left, right, &mut cur, &mut found);
              found.into_iter().collect()
          }
        `,
        php: code`
          function ripDfs($s, $n, $i, $opened, $l, $r, $cur, &$found) {
              if ($i == $n) {
                  if ($l == 0 && $r == 0 && $opened == 0) $found["#" . $cur] = true;
                  return;
              }
              $c = $s[$i];
              if ($c === "(") {
                  if ($l > 0) ripDfs($s, $n, $i + 1, $opened, $l - 1, $r, $cur, $found);
                  ripDfs($s, $n, $i + 1, $opened + 1, $l, $r, $cur . $c, $found);
              } elseif ($c === ")") {
                  if ($r > 0) ripDfs($s, $n, $i + 1, $opened, $l, $r - 1, $cur, $found);
                  if ($opened > 0) ripDfs($s, $n, $i + 1, $opened - 1, $l, $r, $cur . $c, $found);
              } else {
                  ripDfs($s, $n, $i + 1, $opened, $l, $r, $cur . $c, $found);
              }
          }

          function removeInvalidParentheses($s) {
              $left = 0;
              $right = 0;
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  if ($s[$i] === "(") $left++;
                  elseif ($s[$i] === ")") {
                      if ($left > 0) $left--;
                      else $right++;
                  }
              }
              $found = [];
              ripDfs($s, $n, 0, 0, $left, $right, "", $found);
              $res = [];
              foreach ($found as $key => $unused) $res[] = substr((string)$key, 1);
              sort($res, SORT_STRING);
              return $res;
          }
        `,
        ruby: code`
          def rip_dfs(s, i, opened, l, r, cur, found)
            if i == s.length
              found[cur.dup] = true if l == 0 && r == 0 && opened == 0
              return
            end
            c = s[i]
            if c == "("
              rip_dfs(s, i + 1, opened, l - 1, r, cur, found) if l > 0
              cur << c
              rip_dfs(s, i + 1, opened + 1, l, r, cur, found)
              cur.chop!
            elsif c == ")"
              rip_dfs(s, i + 1, opened, l, r - 1, cur, found) if r > 0
              if opened > 0
                cur << c
                rip_dfs(s, i + 1, opened - 1, l, r, cur, found)
                cur.chop!
              end
            else
              cur << c
              rip_dfs(s, i + 1, opened, l, r, cur, found)
              cur.chop!
            end
          end

          def removeInvalidParentheses(s)
            left = 0
            right = 0
            s.each_char do |c|
              if c == "("
                left += 1
              elsif c == ")"
                if left > 0
                  left -= 1
                else
                  right += 1
                end
              end
            end
            found = {}
            rip_dfs(s, 0, 0, left, right, +"", found)
            found.keys.sort
          end
        `,
      },
    };
  })(),

  // ── Student Attendance Record II (LC 552) ───────────────────────
  (() => {
    const MOD = 1000000007;
    // Top-down count over (position, absences used, trailing lates) — a
    // different formulation from the rolling six-state solutions.
    // ways(left, a, l): completions of `left` more sessions given `a` absences
    // so far and a trailing run of `l` lates. Shared across calls; filled in
    // increasing `left` so the recursion stays one level deep.
    const memo = new Map<number, number>();
    const go = (left: number, a: number, l: number): number => {
      if (left === 0) return 1;
      const key = left * 6 + a * 3 + l;
      const hit = memo.get(key);
      if (hit !== undefined) return hit;
      let total = go(left - 1, a, 0);
      if (a === 0) total += go(left - 1, 1, 0);
      if (l < 2) total += go(left - 1, a, l + 1);
      total %= MOD;
      memo.set(key, total);
      return total;
    };
    let warmed = 0;
    const ref = (n: number): number => {
      for (; warmed < n; warmed++) for (let a = 1; a >= 0; a--) for (let l = 2; l >= 0; l--) go(warmed + 1, a, l);
      return go(n, 0, 0);
    };
    // Brute force over every record for tiny n, checked once at load.
    const brute = (n: number) => {
      let count = 0;
      const total = 3 ** n;
      for (let code = 0; code < total; code++) {
        let x = code, a = 0, run = 0, ok = true;
        for (let i = 0; i < n; i++) {
          const c = x % 3; x = Math.floor(x / 3);
          if (c === 0) { a++; run = 0; } else if (c === 1) { run++; if (run >= 3) ok = false; } else run = 0;
        }
        if (ok && a < 2) count++;
      }
      return count;
    };
    for (let n = 1; n <= 8; n++) if (brute(n) !== ref(n)) throw new Error(`student-attendance-record-ii: ref disagrees with brute force at n=${n}`);
    return {
      slug: "student-attendance-record-ii",
      title: "Student Attendance Record II",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Combinatorics", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "checkRecord", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A bootcamp logs each learner's attendance as a string of `n` characters, one per session: `'A'` (absent), `'L'` (late) or `'P'` (present).\n\n" +
        "A learner earns the **perfect-attendance badge** when both hold:\n\n" +
        "- they were absent **fewer than 2** times in total, and\n" +
        "- they were **never late 3 or more sessions in a row**.\n\n" +
        "Given `n`, return how many of the `3^n` possible records of length `n` earn the badge. The count is large, so return it **modulo** `10^9 + 7`.",
        [
          { in: "n = 2", out: "8", note: "All nine records except `\"AA\"` qualify." },
          { in: "n = 4", out: "43" },
          { in: "n = 2026", out: "906370326" },
        ],
        ["1 <= n <= 10^5"]),
      hints: [
        "Build the record one character at a time. What do you need to remember about the prefix to know which characters may come next?",
        "Only two facts matter: how many `A`s so far (0 or 1) and how many `L`s the prefix ends with (0, 1 or 2). That is six states.",
        "From each state: `P` resets the late run, `L` extends it (allowed only below 2), `A` resets the run and is allowed only with 0 absences. Roll the six counts forward `n` times, reducing modulo `10^9 + 7`, and sum them.",
      ],
      editorial: explain({
        idea: "Whether a record can still be extended depends only on (absences so far, current run of trailing lates), which has six values — so count records with a six-state dynamic programme over the length.",
        steps: [
          "Let `dp[a][l]` be the number of valid prefixes of the current length with `a` absences (0 or 1) that end in exactly `l` consecutive `L`s (0, 1 or 2). Start with the empty record: `dp[0][0] = 1`.",
          "For each of the `n` positions compute the next table: appending `P` sends every `dp[a][l]` to `next[a][0]`; appending `L` sends `dp[a][l]` to `next[a][l+1]` when `l < 2`; appending `A` sends every `dp[0][l]` to `next[1][0]`.",
          "So `next[0][0] = Σ dp[0][*]`, `next[0][1] = dp[0][0]`, `next[0][2] = dp[0][1]`, `next[1][0] = Σ dp[0][*] + Σ dp[1][*]`, `next[1][1] = dp[1][0]`, `next[1][2] = dp[1][1]`.",
          "Reduce every entry modulo `10^9 + 7`. After `n` steps return the sum of all six entries modulo `10^9 + 7`.",
        ],
        why: "The two badge rules only ever look at the total number of `A`s and at the current run of `L`s, and both are captured exactly by the state; every valid record of length `k + 1` is a valid record of length `k` plus one allowed character, and each such extension is counted once. So the table counts every valid record exactly once.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The late rule is about **consecutive** `L`s — an `A` or a `P` resets the run, not just `P`.",
          "Sums of three or six residues exceed 32 bits: accumulate in 64-bit integers before reducing.",
          "Enumerating records directly is `3^n` — hopeless beyond `n ≈ 20`.",
        ],
      }),
      examples: [
        { input: "2", expectedOutput: "8" },
        { input: "4", expectedOutput: "43" },
        { input: "2026", expectedOutput: "906370326" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        const n = kind <= 2 ? ri(rng, 1, 20) : kind <= 6 ? ri(rng, 21, 500) : ri(rng, 501, 3000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def checkRecord(n: int) -> int:
              MOD = 10**9 + 7
              a0l0, a0l1, a0l2, a1l0, a1l1, a1l2 = 1, 0, 0, 0, 0, 0
              for _ in range(n):
                  s0 = (a0l0 + a0l1 + a0l2) % MOD
                  s1 = (a1l0 + a1l1 + a1l2) % MOD
                  a0l0, a0l1, a0l2, a1l0, a1l1, a1l2 = s0, a0l0, a0l1, (s0 + s1) % MOD, a1l0, a1l1
              return (a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD
        `,
        javascript: code`
          var checkRecord = function(n) {
              var MOD = 1000000007;
              var a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0;
              for (var i = 0; i < n; i++) {
                  var s0 = (a0l0 + a0l1 + a0l2) % MOD;
                  var s1 = (a1l0 + a1l1 + a1l2) % MOD;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % MOD;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              return (a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD;
          };
        `,
        typescript: code`
          function checkRecord(n: number): number {
              var MOD = 1000000007;
              var a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0;
              for (var i = 0; i < n; i++) {
                  var s0 = (a0l0 + a0l1 + a0l2) % MOD;
                  var s1 = (a1l0 + a1l1 + a1l2) % MOD;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % MOD;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              return (a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD;
          }
        `,
        java: code`
          public static int checkRecord(int n) {
              final long MOD = 1000000007L;
              long a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0;
              for (int i = 0; i < n; i++) {
                  long s0 = (a0l0 + a0l1 + a0l2) % MOD;
                  long s1 = (a1l0 + a1l1 + a1l2) % MOD;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % MOD;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              return (int) ((a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD);
          }
        `,
        cpp: code`
          int checkRecord(int n) {
              const long long MOD = 1000000007LL;
              long long a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0;
              for (int i = 0; i < n; i++) {
                  long long s0 = (a0l0 + a0l1 + a0l2) % MOD;
                  long long s1 = (a1l0 + a1l1 + a1l2) % MOD;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % MOD;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              return (int)((a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD);
          }
        `,
        c: code`
          int checkRecord(int n) {
              const long long MOD = 1000000007LL;
              long long a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0;
              for (int i = 0; i < n; i++) {
                  long long s0 = (a0l0 + a0l1 + a0l2) % MOD;
                  long long s1 = (a1l0 + a1l1 + a1l2) % MOD;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % MOD;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              return (int)((a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD);
          }
        `,
        csharp: code`
          public static int CheckRecord(int n)
          {
              const long MOD = 1000000007L;
              long a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0;
              for (int i = 0; i < n; i++)
              {
                  long s0 = (a0l0 + a0l1 + a0l2) % MOD;
                  long s1 = (a1l0 + a1l1 + a1l2) % MOD;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % MOD;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              return (int)((a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD);
          }
        `,
        go: code`
          func checkRecord(n int) int {
              const MOD = 1000000007
              a0l0, a0l1, a0l2, a1l0, a1l1, a1l2 := 1, 0, 0, 0, 0, 0
              for i := 0; i < n; i++ {
                  s0 := (a0l0 + a0l1 + a0l2) % MOD
                  s1 := (a1l0 + a1l1 + a1l2) % MOD
                  a1l2 = a1l1
                  a1l1 = a1l0
                  a1l0 = (s0 + s1) % MOD
                  a0l2 = a0l1
                  a0l1 = a0l0
                  a0l0 = s0
              }
              return (a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD
          }
        `,
        kotlin: code`
          fun checkRecord(n: Int): Int {
              val MOD = 1000000007L
              var a0l0 = 1L
              var a0l1 = 0L
              var a0l2 = 0L
              var a1l0 = 0L
              var a1l1 = 0L
              var a1l2 = 0L
              for (i in 0 until n) {
                  val s0 = (a0l0 + a0l1 + a0l2) % MOD
                  val s1 = (a1l0 + a1l1 + a1l2) % MOD
                  a1l2 = a1l1
                  a1l1 = a1l0
                  a1l0 = (s0 + s1) % MOD
                  a0l2 = a0l1
                  a0l1 = a0l0
                  a0l0 = s0
              }
              return ((a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD).toInt()
          }
        `,
        swift: code`
          func checkRecord(_ n: Int) -> Int {
              let MOD = 1000000007
              var a0l0 = 1, a0l1 = 0, a0l2 = 0, a1l0 = 0, a1l1 = 0, a1l2 = 0
              var i = 0
              while i < n {
                  let s0 = (a0l0 + a0l1 + a0l2) % MOD
                  let s1 = (a1l0 + a1l1 + a1l2) % MOD
                  a1l2 = a1l1
                  a1l1 = a1l0
                  a1l0 = (s0 + s1) % MOD
                  a0l2 = a0l1
                  a0l1 = a0l0
                  a0l0 = s0
                  i += 1
              }
              return (a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % MOD
          }
        `,
        rust: code`
          fn checkRecord(n: i32) -> i32 {
              let m: i64 = 1_000_000_007;
              let (mut a0l0, mut a0l1, mut a0l2, mut a1l0, mut a1l1, mut a1l2) = (1i64, 0i64, 0i64, 0i64, 0i64, 0i64);
              for _ in 0..n {
                  let s0 = (a0l0 + a0l1 + a0l2) % m;
                  let s1 = (a1l0 + a1l1 + a1l2) % m;
                  a1l2 = a1l1;
                  a1l1 = a1l0;
                  a1l0 = (s0 + s1) % m;
                  a0l2 = a0l1;
                  a0l1 = a0l0;
                  a0l0 = s0;
              }
              ((a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % m) as i32
          }
        `,
        php: code`
          function checkRecord($n) {
              $MOD = 1000000007;
              $a0l0 = 1; $a0l1 = 0; $a0l2 = 0; $a1l0 = 0; $a1l1 = 0; $a1l2 = 0;
              for ($i = 0; $i < $n; $i++) {
                  $s0 = ($a0l0 + $a0l1 + $a0l2) % $MOD;
                  $s1 = ($a1l0 + $a1l1 + $a1l2) % $MOD;
                  $a1l2 = $a1l1;
                  $a1l1 = $a1l0;
                  $a1l0 = ($s0 + $s1) % $MOD;
                  $a0l2 = $a0l1;
                  $a0l1 = $a0l0;
                  $a0l0 = $s0;
              }
              return ($a0l0 + $a0l1 + $a0l2 + $a1l0 + $a1l1 + $a1l2) % $MOD;
          }
        `,
        ruby: code`
          def checkRecord(n)
            mod = 1_000_000_007
            a0l0, a0l1, a0l2, a1l0, a1l1, a1l2 = 1, 0, 0, 0, 0, 0
            n.times do
              s0 = (a0l0 + a0l1 + a0l2) % mod
              s1 = (a1l0 + a1l1 + a1l2) % mod
              a0l0, a0l1, a0l2, a1l0, a1l1, a1l2 = s0, a0l0, a0l1, (s0 + s1) % mod, a1l0, a1l1
            end
            (a0l0 + a0l1 + a0l2 + a1l0 + a1l1 + a1l2) % mod
          end
        `,
      },
    };
  })(),

  // ── Last Substring in Lexicographical Order (LC 1163) ───────────
  (() => {
    const ref = (s: string): string => {
      let best = "";
      for (let i = 0; i < s.length; i++) { const t = s.slice(i); if (t > best) best = t; }
      return best;
    };
    return {
      slug: "last-substring-in-lexicographical-order",
      title: "Last Substring in Lexicographical Order",
      difficulty: "HARD" as const,
      tags: ["String", "Two Pointers", "Google", "Salesforce", "Amazon"],
      signature: { funcName: "lastSubstring", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Consider every non-empty substring of `s` and sort them in lexicographic (dictionary) order. Return the substring that comes **last**.\n\n" +
        "Comparison is the usual one: the first differing character decides, and a string that is a proper prefix of another comes before it.",
        [
          { in: 's = "kairokai"', out: "rokai", note: "`r` is the largest letter and occurs once, so the answer is the suffix starting there." },
          { in: 's = "zazb"', out: "zb", note: "Both `zazb` and `zb` start with `z`; at the second character `b` beats `a`." },
          { in: 's = "bbbb"', out: "bbbb" },
        ],
        ["1 <= s.length <= 4 * 10^5", "s consists of lowercase English letters"]),
      hints: [
        "Extending a substring to the right never makes it smaller, so the answer is always a **suffix** of `s`.",
        "Comparing all suffixes directly is quadratic. Keep two candidate starts `i < j` and the length `k` of their common prefix.",
        "If `s[i+k] < s[j+k]`, no start in `i..i+k` can win — jump `i` to `max(i + k + 1, j)`. If `s[i+k] > s[j+k]`, skip `j` past `j + k`. Each step discards at least `k + 1` starts.",
      ],
      editorial: explain({
        idea: "The answer is the lexicographically largest suffix, and two competing starts can be compared character by character while discarding whole blocks of losing starts at once — the same trick as the minimum-rotation algorithm.",
        steps: [
          "Set `i = 0` (best start so far), `j = 1` (challenger), `k = 0` (matched length).",
          "While `j + k < n`: if `s[i+k] == s[j+k]`, increment `k`.",
          "If `s[i+k] < s[j+k]`: every start in `i..i+k` loses to the matching start in `j..j+k`, so set `i = max(i + k + 1, j)`, `j = i + 1`, `k = 0`.",
          "If `s[i+k] > s[j+k]`: by the same argument every start in `j..j+k` loses, so set `j = j + k + 1`, `k = 0`.",
          "Return the suffix starting at `i`.",
        ],
        why: "When the suffixes at `i` and `j` agree on `k` characters and then `s[i+k] < s[j+k]`, any start `i + p` (with `p <= k`) is beaten by `j + p`: they share `k - p` characters and then differ the same way. So all of `i..i+k` can be dropped; `j` itself survives as the new best unless it was among the dropped ones. The symmetric case drops `j..j+k`. Each step removes at least `k + 1` candidates, and `k` only grows while characters match, so the total work is linear.",
        time: "O(n)",
        space: "O(1) besides the returned suffix",
        pitfalls: [
          "Sorting or comparing all suffixes is `O(n^2)` (or worse) — too slow at `4 * 10^5`.",
          "After a loss of `i`, the new `i` must be at least `j`; jumping to `i + k + 1` alone can skip past a valid candidate or move before `j`.",
          "On an all-equal string like `bbbb` the whole string wins (longer beats its own prefix).",
        ],
      }),
      examples: [
        { input: '"kairokai"', expectedOutput: "rokai" },
        { input: '"zazb"', expectedOutput: "zb" },
        { input: '"bbbb"', expectedOutput: "bbbb" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        let s: string;
        if (kind === 0) s = randLower(rng, 1, 3);
        else if (kind <= 3) s = randLower(rng, 1, 40, pick(rng, ["ab", "ba", "abc", "zy"]));
        else if (kind <= 5) {
          const unit = randLower(rng, 1, 4, "abz");
          s = unit.repeat(ri(rng, 1, 8)) + randLower(rng, 0, 3, "abz");
        } else if (kind === 6) s = pick(rng, ["z", "a", "b"]).repeat(ri(rng, 1, 30));
        else s = randLower(rng, 1, 60);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def lastSubstring(s: str) -> str:
              n = len(s)
              i, j, k = 0, 1, 0
              while j + k < n:
                  if s[i + k] == s[j + k]:
                      k += 1
                  elif s[i + k] < s[j + k]:
                      i = max(i + k + 1, j)
                      j = i + 1
                      k = 0
                  else:
                      j = j + k + 1
                      k = 0
              return s[i:]
        `,
        javascript: code`
          var lastSubstring = function(s) {
              var n = s.length, i = 0, j = 1, k = 0;
              while (j + k < n) {
                  var a = s.charCodeAt(i + k), b = s.charCodeAt(j + k);
                  if (a === b) {
                      k++;
                  } else if (a < b) {
                      i = Math.max(i + k + 1, j);
                      j = i + 1;
                      k = 0;
                  } else {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              return s.substring(i);
          };
        `,
        typescript: code`
          function lastSubstring(s: string): string {
              var n = s.length, i = 0, j = 1, k = 0;
              while (j + k < n) {
                  var a = s.charCodeAt(i + k), b = s.charCodeAt(j + k);
                  if (a === b) {
                      k++;
                  } else if (a < b) {
                      i = Math.max(i + k + 1, j);
                      j = i + 1;
                      k = 0;
                  } else {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              return s.substring(i);
          }
        `,
        java: code`
          public static String lastSubstring(String s) {
              int n = s.length(), i = 0, j = 1, k = 0;
              while (j + k < n) {
                  char a = s.charAt(i + k), b = s.charAt(j + k);
                  if (a == b) {
                      k++;
                  } else if (a < b) {
                      i = Math.max(i + k + 1, j);
                      j = i + 1;
                      k = 0;
                  } else {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              return s.substring(i);
          }
        `,
        cpp: code`
          string lastSubstring(string s) {
              int n = s.size(), i = 0, j = 1, k = 0;
              while (j + k < n) {
                  if (s[i + k] == s[j + k]) {
                      k++;
                  } else if (s[i + k] < s[j + k]) {
                      i = max(i + k + 1, j);
                      j = i + 1;
                      k = 0;
                  } else {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              return s.substr(i);
          }
        `,
        c: code`
          char* lastSubstring(const char* s) {
              int n = (int)strlen(s), i = 0, j = 1, k = 0;
              while (j + k < n) {
                  if (s[i + k] == s[j + k]) {
                      k++;
                  } else if (s[i + k] < s[j + k]) {
                      i = (i + k + 1 > j) ? i + k + 1 : j;
                      j = i + 1;
                      k = 0;
                  } else {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              char* res = (char*)malloc(n - i + 1);
              memcpy(res, s + i, n - i + 1);
              return res;
          }
        `,
        csharp: code`
          public static string LastSubstring(string s)
          {
              int n = s.Length, i = 0, j = 1, k = 0;
              while (j + k < n)
              {
                  char a = s[i + k], b = s[j + k];
                  if (a == b)
                  {
                      k++;
                  }
                  else if (a < b)
                  {
                      i = Math.Max(i + k + 1, j);
                      j = i + 1;
                      k = 0;
                  }
                  else
                  {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              return s.Substring(i);
          }
        `,
        go: code`
          func lastSubstring(s string) string {
              n, i, j, k := len(s), 0, 1, 0
              for j+k < n {
                  if s[i+k] == s[j+k] {
                      k++
                  } else if s[i+k] < s[j+k] {
                      if i+k+1 > j {
                          i = i + k + 1
                      } else {
                          i = j
                      }
                      j = i + 1
                      k = 0
                  } else {
                      j = j + k + 1
                      k = 0
                  }
              }
              return s[i:]
          }
        `,
        kotlin: code`
          fun lastSubstring(s: String): String {
              val n = s.length
              var i = 0
              var j = 1
              var k = 0
              while (j + k < n) {
                  val a = s[i + k]
                  val b = s[j + k]
                  if (a == b) {
                      k++
                  } else if (a < b) {
                      i = maxOf(i + k + 1, j)
                      j = i + 1
                      k = 0
                  } else {
                      j = j + k + 1
                      k = 0
                  }
              }
              return s.substring(i)
          }
        `,
        swift: code`
          func lastSubstring(_ s: String) -> String {
              let a = Array(s.utf8)
              let n = a.count
              var i = 0, j = 1, k = 0
              while j + k < n {
                  if a[i + k] == a[j + k] {
                      k += 1
                  } else if a[i + k] < a[j + k] {
                      i = max(i + k + 1, j)
                      j = i + 1
                      k = 0
                  } else {
                      j = j + k + 1
                      k = 0
                  }
              }
              return String(decoding: a[i..<n], as: UTF8.self)
          }
        `,
        rust: code`
          fn lastSubstring(s: String) -> String {
              let a = s.as_bytes();
              let n = a.len();
              let (mut i, mut j, mut k) = (0usize, 1usize, 0usize);
              while j + k < n {
                  if a[i + k] == a[j + k] {
                      k += 1;
                  } else if a[i + k] < a[j + k] {
                      i = std::cmp::max(i + k + 1, j);
                      j = i + 1;
                      k = 0;
                  } else {
                      j = j + k + 1;
                      k = 0;
                  }
              }
              s[i..].to_string()
          }
        `,
        php: code`
          function lastSubstring($s) {
              $n = strlen($s);
              $i = 0;
              $j = 1;
              $k = 0;
              while ($j + $k < $n) {
                  $a = ord($s[$i + $k]);
                  $b = ord($s[$j + $k]);
                  if ($a == $b) {
                      $k++;
                  } elseif ($a < $b) {
                      $i = ($i + $k + 1 > $j) ? $i + $k + 1 : $j;
                      $j = $i + 1;
                      $k = 0;
                  } else {
                      $j = $j + $k + 1;
                      $k = 0;
                  }
              }
              return substr($s, $i);
          }
        `,
        ruby: code`
          def lastSubstring(s)
            n = s.length
            b = s.bytes
            i = 0
            j = 1
            k = 0
            while j + k < n
              if b[i + k] == b[j + k]
                k += 1
              elsif b[i + k] < b[j + k]
                i = [i + k + 1, j].max
                j = i + 1
                k = 0
              else
                j = j + k + 1
                k = 0
              end
            end
            s[i..-1]
          end
        `,
      },
    };
  })(),

  // ── Parsing A Boolean Expression (LC 1106) ──────────────────────
  (() => {
    // Recursive-descent evaluator — independent of the stack solutions.
    const ref = (e: string): boolean => {
      let p = 0;
      const parse = (): boolean => {
        const c = e[p++];
        if (c === "t") return true;
        if (c === "f") return false;
        p++; // "("
        const vals: boolean[] = [parse()];
        while (e[p] === ",") { p++; vals.push(parse()); }
        p++; // ")"
        if (c === "!") return !vals[0];
        if (c === "&") return vals.every((v) => v);
        return vals.some((v) => v);
      };
      return parse();
    };
    const build = (rng: Rng, depth: number): string => {
      if (depth === 0 || rng() < 0.3) return rng() < 0.5 ? "t" : "f";
      const op = pick(rng, ["!", "&", "|", "&", "|"]);
      if (op === "!") return `!(${build(rng, depth - 1)})`;
      const k = ri(rng, 1, 3);
      const parts: string[] = [];
      for (let i = 0; i < k; i++) parts.push(build(rng, depth - 1));
      return `${op}(${parts.join(",")})`;
    };
    return {
      slug: "parsing-a-boolean-expression",
      title: "Parsing A Boolean Expression",
      difficulty: "HARD" as const,
      tags: ["String", "Stack", "Recursion", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "parseBoolExpr", params: [{ name: "expression", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A CodeKairo feature flag is written as a boolean expression in a tiny prefix language. An expression is one of:\n\n" +
        "- `t` — true;\n" +
        "- `f` — false;\n" +
        "- `!(e)` — the logical NOT of the inner expression `e`;\n" +
        "- `&(e1,e2,...,ek)` — the logical AND of one or more inner expressions;\n" +
        "- `|(e1,e2,...,ek)` — the logical OR of one or more inner expressions.\n\n" +
        "Given a valid `expression`, return what it evaluates to.",
        [
          { in: 'expression = "|(&(t,f,t),!(f))"', out: "true", note: "`&(t,f,t)` is false and `!(f)` is true, so the OR is true." },
          { in: 'expression = "&(|(f,t),!(t))"', out: "false" },
          { in: 'expression = "|(f)"', out: "false" },
        ],
        [
          "1 <= expression.length <= 2 * 10^4",
          "expression[i] is one of '(', ')', '&', '|', '!', 't', 'f' and ','",
          "expression is a valid expression as defined above",
        ]),
      hints: [
        "An operator's value is only known once its closing `)` is reached — that suggests a stack.",
        "Push every character except commas. On `)`, pop values until the matching `(`, counting how many were `t` and how many `f`.",
        "Then pop the `(` and the operator below it: `!` gives true iff the single value was `f`, `&` gives true iff no `f` was seen, `|` gives true iff some `t` was seen. Push the result as `t`/`f`.",
      ],
      editorial: explain({
        idea: "Evaluate bottom-up with one stack: by the time a `)` arrives, all of its operands have already been reduced to single `t`/`f` characters sitting above its `(`.",
        steps: [
          "Scan the expression; skip commas and push every other character except `)`.",
          "On `)`: pop characters until the top is `(`, counting the `t`s and `f`s popped.",
          "Pop the `(` and then the operator.",
          "Compute the result — `!`: true iff the operand was `f`; `&`: true iff the `f`-count is 0; `|`: true iff the `t`-count is positive — and push it as `t` or `f`.",
          "When the scan ends, the stack holds one character; return whether it is `t`.",
        ],
        why: "Each `)` closes the innermost open operator, and every operand of that operator is either a literal or an inner expression whose own `)` came earlier and was already replaced by its value. So the popped run is exactly the operator's list of operand values. AND and OR only need to know whether a false or a true value is present, which the counts provide.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Forgetting to skip commas mixes them into the operand counts.",
          "An operator can have a single operand (`|(f)`, `&(t)`); the counting rule handles it without special cases.",
          "A recursive parser works too, but a 2 * 10^4-character expression can nest deeply — the explicit stack avoids recursion limits.",
        ],
      }),
      examples: [
        { input: '"|(&(t,f,t),!(f))"', expectedOutput: "true" },
        { input: '"&(|(f,t),!(t))"', expectedOutput: "false" },
        { input: '"|(f)"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const e = build(rng, ri(rng, 0, 5));
        return { input: `"${e}"`, expectedOutput: bool(ref(e)) };
      },
      solutions: {
        python: code`
          def parseBoolExpr(expression: str) -> bool:
              st = []
              for c in expression:
                  if c == ",":
                      continue
                  if c != ")":
                      st.append(c)
                      continue
                  t = f = 0
                  while st[-1] != "(":
                      if st.pop() == "t":
                          t += 1
                      else:
                          f += 1
                  st.pop()
                  op = st.pop()
                  if op == "!":
                      r = f > 0
                  elif op == "&":
                      r = f == 0
                  else:
                      r = t > 0
                  st.append("t" if r else "f")
              return st[-1] == "t"
        `,
        javascript: code`
          var parseBoolExpr = function(expression) {
              var st = [];
              for (var i = 0; i < expression.length; i++) {
                  var c = expression[i];
                  if (c === ",") continue;
                  if (c !== ")") {
                      st.push(c);
                      continue;
                  }
                  var t = 0, f = 0;
                  while (st[st.length - 1] !== "(") {
                      if (st.pop() === "t") t++;
                      else f++;
                  }
                  st.pop();
                  var op = st.pop();
                  var r = op === "!" ? f > 0 : op === "&" ? f === 0 : t > 0;
                  st.push(r ? "t" : "f");
              }
              return st[st.length - 1] === "t";
          };
        `,
        typescript: code`
          function parseBoolExpr(expression: string): boolean {
              var st: string[] = [];
              for (var i = 0; i < expression.length; i++) {
                  var c = expression.charAt(i);
                  if (c === ",") continue;
                  if (c !== ")") {
                      st.push(c);
                      continue;
                  }
                  var t = 0, f = 0;
                  while (st[st.length - 1] !== "(") {
                      if (st.pop() === "t") t++;
                      else f++;
                  }
                  st.pop();
                  var op = st.pop();
                  var r = op === "!" ? f > 0 : op === "&" ? f === 0 : t > 0;
                  st.push(r ? "t" : "f");
              }
              return st[st.length - 1] === "t";
          }
        `,
        java: code`
          public static boolean parseBoolExpr(String expression) {
              char[] st = new char[expression.length() + 1];
              int top = 0;
              for (int i = 0; i < expression.length(); i++) {
                  char c = expression.charAt(i);
                  if (c == ',') continue;
                  if (c != ')') {
                      st[top++] = c;
                      continue;
                  }
                  int t = 0, f = 0;
                  while (st[top - 1] != '(') {
                      if (st[--top] == 't') t++;
                      else f++;
                  }
                  top--;
                  char op = st[--top];
                  boolean r = op == '!' ? f > 0 : op == '&' ? f == 0 : t > 0;
                  st[top++] = r ? 't' : 'f';
              }
              return st[top - 1] == 't';
          }
        `,
        cpp: code`
          bool parseBoolExpr(string expression) {
              vector<char> st;
              for (char c : expression) {
                  if (c == ',') continue;
                  if (c != ')') {
                      st.push_back(c);
                      continue;
                  }
                  int t = 0, f = 0;
                  while (st.back() != '(') {
                      if (st.back() == 't') t++;
                      else f++;
                      st.pop_back();
                  }
                  st.pop_back();
                  char op = st.back();
                  st.pop_back();
                  bool r = op == '!' ? f > 0 : op == '&' ? f == 0 : t > 0;
                  st.push_back(r ? 't' : 'f');
              }
              return st.back() == 't';
          }
        `,
        c: code`
          bool parseBoolExpr(const char* expression) {
              int n = (int)strlen(expression);
              char* st = (char*)malloc(n + 1);
              int top = 0;
              for (int i = 0; i < n; i++) {
                  char c = expression[i];
                  if (c == ',') continue;
                  if (c != ')') {
                      st[top++] = c;
                      continue;
                  }
                  int t = 0, f = 0;
                  while (st[top - 1] != '(') {
                      if (st[--top] == 't') t++;
                      else f++;
                  }
                  top--;
                  char op = st[--top];
                  bool r = op == '!' ? f > 0 : op == '&' ? f == 0 : t > 0;
                  st[top++] = r ? 't' : 'f';
              }
              bool res = st[top - 1] == 't';
              free(st);
              return res;
          }
        `,
        csharp: code`
          public static bool ParseBoolExpr(string expression)
          {
              var st = new char[expression.Length + 1];
              int top = 0;
              foreach (char c in expression)
              {
                  if (c == ',') continue;
                  if (c != ')')
                  {
                      st[top++] = c;
                      continue;
                  }
                  int t = 0, f = 0;
                  while (st[top - 1] != '(')
                  {
                      if (st[--top] == 't') t++;
                      else f++;
                  }
                  top--;
                  char op = st[--top];
                  bool r = op == '!' ? f > 0 : op == '&' ? f == 0 : t > 0;
                  st[top++] = r ? 't' : 'f';
              }
              return st[top - 1] == 't';
          }
        `,
        go: code`
          func parseBoolExpr(expression string) bool {
              st := make([]byte, 0, len(expression))
              for i := 0; i < len(expression); i++ {
                  c := expression[i]
                  if c == ',' {
                      continue
                  }
                  if c != ')' {
                      st = append(st, c)
                      continue
                  }
                  t, f := 0, 0
                  for st[len(st)-1] != '(' {
                      if st[len(st)-1] == 't' {
                          t++
                      } else {
                          f++
                      }
                      st = st[:len(st)-1]
                  }
                  st = st[:len(st)-1]
                  op := st[len(st)-1]
                  st = st[:len(st)-1]
                  var r bool
                  if op == '!' {
                      r = f > 0
                  } else if op == '&' {
                      r = f == 0
                  } else {
                      r = t > 0
                  }
                  if r {
                      st = append(st, 't')
                  } else {
                      st = append(st, 'f')
                  }
              }
              return st[len(st)-1] == 't'
          }
        `,
        kotlin: code`
          fun parseBoolExpr(expression: String): Boolean {
              val st = CharArray(expression.length + 1)
              var top = 0
              for (c in expression) {
                  if (c == ',') continue
                  if (c != ')') {
                      st[top++] = c
                      continue
                  }
                  var t = 0
                  var f = 0
                  while (st[top - 1] != '(') {
                      top--
                      if (st[top] == 't') t++ else f++
                  }
                  top--
                  top--
                  val op = st[top]
                  val r = if (op == '!') f > 0 else if (op == '&') f == 0 else t > 0
                  st[top++] = if (r) 't' else 'f'
              }
              return st[top - 1] == 't'
          }
        `,
        swift: code`
          func parseBoolExpr(_ expression: String) -> Bool {
              var st: [UInt8] = []
              for c in expression.utf8 {
                  if c == 44 { continue }
                  if c != 41 {
                      st.append(c)
                      continue
                  }
                  var t = 0, f = 0
                  while st[st.count - 1] != 40 {
                      if st.removeLast() == 116 { t += 1 } else { f += 1 }
                  }
                  st.removeLast()
                  let op = st.removeLast()
                  let r: Bool
                  if op == 33 {
                      r = f > 0
                  } else if op == 38 {
                      r = f == 0
                  } else {
                      r = t > 0
                  }
                  st.append(r ? 116 : 102)
              }
              return st[st.count - 1] == 116
          }
        `,
        rust: code`
          fn parseBoolExpr(expression: String) -> bool {
              let mut st: Vec<u8> = Vec::new();
              for &c in expression.as_bytes().iter() {
                  if c == b',' {
                      continue;
                  }
                  if c != b')' {
                      st.push(c);
                      continue;
                  }
                  let (mut t, mut f) = (0, 0);
                  while *st.last().unwrap() != b'(' {
                      if st.pop().unwrap() == b't' {
                          t += 1;
                      } else {
                          f += 1;
                      }
                  }
                  st.pop();
                  let op = st.pop().unwrap();
                  let r = if op == b'!' { f > 0 } else if op == b'&' { f == 0 } else { t > 0 };
                  st.push(if r { b't' } else { b'f' });
              }
              *st.last().unwrap() == b't'
          }
        `,
        php: code`
          function parseBoolExpr($expression) {
              $st = [];
              $n = strlen($expression);
              for ($i = 0; $i < $n; $i++) {
                  $c = $expression[$i];
                  if ($c === ",") continue;
                  if ($c !== ")") {
                      $st[] = $c;
                      continue;
                  }
                  $t = 0;
                  $f = 0;
                  while (end($st) !== "(") {
                      if (array_pop($st) === "t") $t++;
                      else $f++;
                  }
                  array_pop($st);
                  $op = array_pop($st);
                  if ($op === "!") $r = $f > 0;
                  elseif ($op === "&") $r = $f == 0;
                  else $r = $t > 0;
                  $st[] = $r ? "t" : "f";
              }
              return end($st) === "t";
          }
        `,
        ruby: code`
          def parseBoolExpr(expression)
            st = []
            expression.each_char do |c|
              next if c == ","
              if c != ")"
                st << c
                next
              end
              t = 0
              f = 0
              while st[-1] != "("
                if st.pop == "t"
                  t += 1
                else
                  f += 1
                end
              end
              st.pop
              op = st.pop
              r = if op == "!" then f > 0 elsif op == "&" then f == 0 else t > 0 end
              st << (r ? "t" : "f")
            end
            st[-1] == "t"
          end
        `,
      },
    };
  })(),

  // ── Find Longest Awesome Substring (LC 1542) ────────────────────
  (() => {
    const ref = (s: string): number => {
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        const cnt = new Array(10).fill(0);
        let odd = 0;
        for (let j = i; j < s.length; j++) {
          const d = s.charCodeAt(j) - 48;
          cnt[d]++;
          odd += cnt[d] % 2 === 1 ? 1 : -1;
          if (odd <= 1) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    };
    return {
      slug: "find-longest-awesome-substring",
      title: "Find Longest Awesome Substring",
      difficulty: "HARD" as const,
      tags: ["String", "Hash Table", "Bit Manipulation", "Prefix Sum", "Directi", "Amazon"],
      signature: { funcName: "longestAwesome", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` is a string of decimal digits. A non-empty substring of `s` is **awesome** if its digits can be **rearranged** (any number of swaps) into a palindrome.\n\n" +
        "Return the length of the longest awesome substring of `s`.",
        [
          { in: 's = "2026"', out: "3", note: "`\"202\"` is already a palindrome; the whole string has two digits (0 and 6) with an odd count, so it cannot be rearranged into one." },
          { in: 's = "12345678"', out: "1", note: "No two equal digits exist, so only single characters work." },
          { in: 's = "1221331"', out: "7", note: "Only the digit 1 occurs an odd number of times, e.g. `\"1323231\"`." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of digits"]),
      hints: [
        "A multiset of characters can be arranged into a palindrome exactly when at most one character has an odd count.",
        "Only the parity of each digit's count matters — ten bits. Compute the parity mask of every prefix.",
        "The substring between prefixes `i` and `j` has parity mask `mask[i] XOR mask[j]`; it is awesome if that XOR is 0 or a single bit. Store the first index each mask occurs and, at every position, look up the current mask and its ten one-bit neighbours.",
      ],
      editorial: explain({
        idea: "Encode the odd/even count of each digit in a 10-bit prefix mask. A substring is awesome when the masks at its two ends differ in at most one bit, so remembering where each mask first appeared answers each position in eleven lookups.",
        steps: [
          "Keep `first[mask]`, the earliest prefix length with that parity mask; set `first[0] = 0` (the empty prefix) and mark the other 1,023 as unseen.",
          "Walk the string; after reading digit `d` at position `j` (1-based prefix length `j`), flip bit `d` of `mask`.",
          "If `mask` was seen before, the substring between is all-even: update the answer with `j - first[mask]`.",
          "For each digit `b`, if `mask ^ (1 << b)` was seen, that substring has exactly one odd digit: update with `j - first[mask ^ (1 << b)]`.",
          "If `mask` is new, record `first[mask] = j`. Return the best length.",
        ],
        why: "The count of digit `d` in `s[i..j)` is the difference of two prefix counts, so its parity is the XOR of the two prefix parities; the substring's parity mask is therefore `mask[i] ^ mask[j]`. A palindrome arrangement exists iff that mask has at most one set bit. For a fixed right end the longest such substring uses the earliest compatible left prefix, which is exactly what `first` stores.",
        time: "O(10 · n)",
        space: "O(2^10)",
        pitfalls: [
          "Recording a mask's index again when it reappears loses the earliest position — only set `first` the first time.",
          "Forgetting the empty prefix (`first[0] = 0`) misses awesome substrings that start at index 0.",
          "Checking only the all-even case misses the palindromes with one odd centre digit.",
        ],
      }),
      examples: [
        { input: '"2026"', expectedOutput: "3" },
        { input: '"12345678"', expectedOutput: "1" },
        { input: '"1221331"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["01", "012", "0123456789", "12", "9", "123", "0123456789"]);
        const n = pick(rng, [ri(rng, 1, 5), ri(rng, 1, 25), ri(rng, 20, 60)]);
        const s = randLower(rng, n, n, alpha);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def longestAwesome(s: str) -> int:
              first = [-1] * 1024
              first[0] = 0
              mask = 0
              best = 0
              for j, ch in enumerate(s, 1):
                  mask ^= 1 << (ord(ch) - 48)
                  if first[mask] >= 0:
                      best = max(best, j - first[mask])
                  for b in range(10):
                      m = mask ^ (1 << b)
                      if first[m] >= 0 and j - first[m] > best:
                          best = j - first[m]
                  if first[mask] < 0:
                      first[mask] = j
              return best
        `,
        javascript: code`
          var longestAwesome = function(s) {
              var first = new Array(1024).fill(-1);
              first[0] = 0;
              var mask = 0, best = 0;
              for (var j = 1; j <= s.length; j++) {
                  mask ^= 1 << (s.charCodeAt(j - 1) - 48);
                  if (first[mask] >= 0) best = Math.max(best, j - first[mask]);
                  for (var b = 0; b < 10; b++) {
                      var m = mask ^ (1 << b);
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m];
                  }
                  if (first[mask] < 0) first[mask] = j;
              }
              return best;
          };
        `,
        typescript: code`
          function longestAwesome(s: string): number {
              var first: number[] = [];
              for (var q = 0; q < 1024; q++) first.push(-1);
              first[0] = 0;
              var mask = 0, best = 0;
              for (var j = 1; j <= s.length; j++) {
                  mask ^= 1 << (s.charCodeAt(j - 1) - 48);
                  if (first[mask] >= 0) best = Math.max(best, j - first[mask]);
                  for (var b = 0; b < 10; b++) {
                      var m = mask ^ (1 << b);
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m];
                  }
                  if (first[mask] < 0) first[mask] = j;
              }
              return best;
          }
        `,
        java: code`
          public static int longestAwesome(String s) {
              int[] first = new int[1024];
              Arrays.fill(first, -1);
              first[0] = 0;
              int mask = 0, best = 0;
              for (int j = 1; j <= s.length(); j++) {
                  mask ^= 1 << (s.charAt(j - 1) - '0');
                  if (first[mask] >= 0) best = Math.max(best, j - first[mask]);
                  for (int b = 0; b < 10; b++) {
                      int m = mask ^ (1 << b);
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m];
                  }
                  if (first[mask] < 0) first[mask] = j;
              }
              return best;
          }
        `,
        cpp: code`
          int longestAwesome(string s) {
              vector<int> first(1024, -1);
              first[0] = 0;
              int mask = 0, best = 0;
              for (int j = 1; j <= (int)s.size(); j++) {
                  mask ^= 1 << (s[j - 1] - '0');
                  if (first[mask] >= 0) best = max(best, j - first[mask]);
                  for (int b = 0; b < 10; b++) {
                      int m = mask ^ (1 << b);
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m];
                  }
                  if (first[mask] < 0) first[mask] = j;
              }
              return best;
          }
        `,
        c: code`
          int longestAwesome(const char* s) {
              int first[1024];
              for (int q = 0; q < 1024; q++) first[q] = -1;
              first[0] = 0;
              int mask = 0, best = 0;
              int n = (int)strlen(s);
              for (int j = 1; j <= n; j++) {
                  mask ^= 1 << (s[j - 1] - '0');
                  if (first[mask] >= 0 && j - first[mask] > best) best = j - first[mask];
                  for (int b = 0; b < 10; b++) {
                      int m = mask ^ (1 << b);
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m];
                  }
                  if (first[mask] < 0) first[mask] = j;
              }
              return best;
          }
        `,
        csharp: code`
          public static int LongestAwesome(string s)
          {
              var first = new int[1024];
              for (int q = 0; q < 1024; q++) first[q] = -1;
              first[0] = 0;
              int mask = 0, best = 0;
              for (int j = 1; j <= s.Length; j++)
              {
                  mask ^= 1 << (s[j - 1] - '0');
                  if (first[mask] >= 0) best = Math.Max(best, j - first[mask]);
                  for (int b = 0; b < 10; b++)
                  {
                      int m = mask ^ (1 << b);
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m];
                  }
                  if (first[mask] < 0) first[mask] = j;
              }
              return best;
          }
        `,
        go: code`
          func longestAwesome(s string) int {
              first := make([]int, 1024)
              for q := range first {
                  first[q] = -1
              }
              first[0] = 0
              mask, best := 0, 0
              for j := 1; j <= len(s); j++ {
                  mask ^= 1 << uint(s[j-1]-'0')
                  if first[mask] >= 0 && j-first[mask] > best {
                      best = j - first[mask]
                  }
                  for b := 0; b < 10; b++ {
                      m := mask ^ (1 << uint(b))
                      if first[m] >= 0 && j-first[m] > best {
                          best = j - first[m]
                      }
                  }
                  if first[mask] < 0 {
                      first[mask] = j
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestAwesome(s: String): Int {
              val first = IntArray(1024) { -1 }
              first[0] = 0
              var mask = 0
              var best = 0
              for (j in 1..s.length) {
                  mask = mask xor (1 shl (s[j - 1] - '0'))
                  if (first[mask] >= 0 && j - first[mask] > best) best = j - first[mask]
                  for (b in 0 until 10) {
                      val m = mask xor (1 shl b)
                      if (first[m] >= 0 && j - first[m] > best) best = j - first[m]
                  }
                  if (first[mask] < 0) first[mask] = j
              }
              return best
          }
        `,
        swift: code`
          func longestAwesome(_ s: String) -> Int {
              let a = Array(s.utf8)
              var first = [Int](repeating: -1, count: 1024)
              first[0] = 0
              var mask = 0, best = 0
              var j = 1
              while j <= a.count {
                  mask ^= 1 << (Int(a[j - 1]) - 48)
                  if first[mask] >= 0 && j - first[mask] > best { best = j - first[mask] }
                  for b in 0..<10 {
                      let m = mask ^ (1 << b)
                      if first[m] >= 0 && j - first[m] > best { best = j - first[m] }
                  }
                  if first[mask] < 0 { first[mask] = j }
                  j += 1
              }
              return best
          }
        `,
        rust: code`
          fn longestAwesome(s: String) -> i32 {
              let a = s.as_bytes();
              let mut first = vec![-1i32; 1024];
              first[0] = 0;
              let mut mask: usize = 0;
              let mut best: i32 = 0;
              for j in 1..=a.len() {
                  mask ^= 1 << ((a[j - 1] - b'0') as usize);
                  let jj = j as i32;
                  if first[mask] >= 0 && jj - first[mask] > best {
                      best = jj - first[mask];
                  }
                  for b in 0..10 {
                      let m = mask ^ (1 << b);
                      if first[m] >= 0 && jj - first[m] > best {
                          best = jj - first[m];
                      }
                  }
                  if first[mask] < 0 {
                      first[mask] = jj;
                  }
              }
              best
          }
        `,
        php: code`
          function longestAwesome($s) {
              $first = array_fill(0, 1024, -1);
              $first[0] = 0;
              $mask = 0;
              $best = 0;
              $n = strlen($s);
              for ($j = 1; $j <= $n; $j++) {
                  $mask ^= 1 << (ord($s[$j - 1]) - 48);
                  if ($first[$mask] >= 0 && $j - $first[$mask] > $best) $best = $j - $first[$mask];
                  for ($b = 0; $b < 10; $b++) {
                      $m = $mask ^ (1 << $b);
                      if ($first[$m] >= 0 && $j - $first[$m] > $best) $best = $j - $first[$m];
                  }
                  if ($first[$mask] < 0) $first[$mask] = $j;
              }
              return $best;
          }
        `,
        ruby: code`
          def longestAwesome(s)
            first = Array.new(1024, -1)
            first[0] = 0
            mask = 0
            best = 0
            j = 0
            s.each_byte do |c|
              j += 1
              mask ^= 1 << (c - 48)
              best = j - first[mask] if first[mask] >= 0 && j - first[mask] > best
              10.times do |b|
                m = mask ^ (1 << b)
                best = j - first[m] if first[m] >= 0 && j - first[m] > best
              end
              first[mask] = j if first[mask] < 0
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Sum of Scores of Built Strings (LC 2223) ────────────────────
  (() => {
    const ref = (s: string): number => {
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        let k = 0;
        while (i + k < s.length && s[k] === s[i + k]) k++;
        total += k;
      }
      return total;
    };
    return {
      slug: "sum-of-scores-of-built-strings",
      title: "Sum of Scores of Built Strings",
      difficulty: "HARD" as const,
      tags: ["String", "String Matching", "Rolling Hash", "Binary Search", "Google", "Amazon"],
      signature: { funcName: "sumScores", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string of length `n` is built one character at a time by **prepending** to the front. Label the intermediate strings `s_1, s_2, …, s_n`, where `s_i` has length `i` — so `s_i` is the suffix of the final string `s = s_n` made of its last `i` characters.\n\n" +
        "The **score** of `s_i` is the length of the longest common prefix of `s_i` and `s_n`.\n\n" +
        "Given the final string `s`, return the sum of the scores of all of `s_1, …, s_n`.\n\n" +
        "*CodeKairo bound:* `s` is at most 60,000 characters here, so the answer always fits in a 32-bit integer.",
        [
          { in: 's = "kaikai"', out: "9", note: "`kaikai` scores 6 and `kai` scores 3; every other suffix starts with a letter other than `k` and scores 0." },
          { in: 's = "aaaa"', out: "10", note: "The suffixes score 1, 2, 3 and 4." },
          { in: 's = "abcab"', out: "7", note: "`ab` scores 2 and `abcab` scores 5." },
        ],
        ["1 <= s.length <= 6 * 10^4", "s consists of lowercase English letters"]),
      hints: [
        "Each `s_i` is a suffix of `s`, so you need, for every suffix, the length of its longest common prefix with `s` itself.",
        "That array is exactly the **Z-function** of `s` (with `z[0] = n`).",
        "Compute the Z-array in linear time with the `[l, r)` window trick — reuse `z[i - l]` inside the window and extend by direct comparison only past `r` — then add it up.",
      ],
      editorial: explain({
        idea: "The score of the suffix starting at index `i` is `LCP(s[i..], s)`, which is the definition of `z[i]` in the Z-function. The answer is therefore the sum of the Z-array, computable in `O(n)`.",
        steps: [
          "Set `z[0] = n` (the whole string matches itself) and keep a window `[l, r)` — the rightmost segment known to equal a prefix of `s`.",
          "For each `i` from 1: if `i < r`, start from `z[i] = min(r - i, z[i - l])`, because `s[l..r)` mirrors `s[0..r-l)`.",
          "Extend `z[i]` while `s[z[i]] == s[i + z[i]]`.",
          "If `i + z[i] > r`, move the window to `[i, i + z[i])`.",
          "Return the sum of all `z[i]`.",
        ],
        why: "Inside the window, the characters from `i` onward equal those from `i - l`, so `z[i - l]` is a valid lower bound as long as it stays inside the window — hence the `min` with `r - i`. Every successful extension pushes `r` to the right, and `r` never exceeds `n`, so the total number of character comparisons is linear.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Comparing each suffix with `s` directly is `O(n^2)` — fine for a check, too slow for long strings.",
          "Do not forget the full string itself: it contributes `n`.",
          "On the original problem (`n` up to 10^5) the sum needs 64 bits; it fits here only because of the tighter bound.",
        ],
      }),
      examples: [
        { input: '"kaikai"', expectedOutput: "9" },
        { input: '"aaaa"', expectedOutput: "10" },
        { input: '"abcab"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        let s: string;
        if (kind <= 1) s = pick(rng, ["a", "b"]).repeat(ri(rng, 1, 60));
        else if (kind <= 4) {
          const unit = randLower(rng, 1, 4, pick(rng, ["ab", "abc"]));
          s = (unit.repeat(ri(rng, 1, 15)) + randLower(rng, 0, 3, "abc")).slice(0, 60);
        } else if (kind <= 7) s = randLower(rng, 1, 60, pick(rng, ["ab", "abc", "aab"]));
        else s = randLower(rng, 1, 40);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def sumScores(s: str) -> int:
              n = len(s)
              z = [0] * n
              z[0] = n
              l = r = 0
              for i in range(1, n):
                  if i < r:
                      z[i] = min(r - i, z[i - l])
                  while i + z[i] < n and s[z[i]] == s[i + z[i]]:
                      z[i] += 1
                  if i + z[i] > r:
                      l, r = i, i + z[i]
              return sum(z)
        `,
        javascript: code`
          var sumScores = function(s) {
              var n = s.length;
              var z = new Array(n).fill(0);
              z[0] = n;
              var l = 0, r = 0, total = n;
              for (var i = 1; i < n; i++) {
                  if (i < r) z[i] = Math.min(r - i, z[i - l]);
                  while (i + z[i] < n && s.charCodeAt(z[i]) === s.charCodeAt(i + z[i])) z[i]++;
                  if (i + z[i] > r) {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i];
              }
              return total;
          };
        `,
        typescript: code`
          function sumScores(s: string): number {
              var n = s.length;
              var z: number[] = [];
              for (var q = 0; q < n; q++) z.push(0);
              z[0] = n;
              var l = 0, r = 0, total = n;
              for (var i = 1; i < n; i++) {
                  if (i < r) z[i] = Math.min(r - i, z[i - l]);
                  while (i + z[i] < n && s.charCodeAt(z[i]) === s.charCodeAt(i + z[i])) z[i]++;
                  if (i + z[i] > r) {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i];
              }
              return total;
          }
        `,
        java: code`
          public static int sumScores(String s) {
              int n = s.length();
              int[] z = new int[n];
              z[0] = n;
              int l = 0, r = 0;
              long total = n;
              for (int i = 1; i < n; i++) {
                  if (i < r) z[i] = Math.min(r - i, z[i - l]);
                  while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
                  if (i + z[i] > r) {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i];
              }
              return (int) total;
          }
        `,
        cpp: code`
          int sumScores(string s) {
              int n = s.size();
              vector<int> z(n, 0);
              z[0] = n;
              int l = 0, r = 0;
              long long total = n;
              for (int i = 1; i < n; i++) {
                  if (i < r) z[i] = min(r - i, z[i - l]);
                  while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
                  if (i + z[i] > r) {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i];
              }
              return (int)total;
          }
        `,
        c: code`
          int sumScores(const char* s) {
              int n = (int)strlen(s);
              int* z = (int*)calloc(n, sizeof(int));
              z[0] = n;
              int l = 0, r = 0;
              long long total = n;
              for (int i = 1; i < n; i++) {
                  if (i < r) z[i] = (r - i < z[i - l]) ? r - i : z[i - l];
                  while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
                  if (i + z[i] > r) {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i];
              }
              free(z);
              return (int)total;
          }
        `,
        csharp: code`
          public static int SumScores(string s)
          {
              int n = s.Length;
              var z = new int[n];
              z[0] = n;
              int l = 0, r = 0;
              long total = n;
              for (int i = 1; i < n; i++)
              {
                  if (i < r) z[i] = Math.Min(r - i, z[i - l]);
                  while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
                  if (i + z[i] > r)
                  {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i];
              }
              return (int)total;
          }
        `,
        go: code`
          func sumScores(s string) int {
              n := len(s)
              z := make([]int, n)
              z[0] = n
              l, r, total := 0, 0, n
              for i := 1; i < n; i++ {
                  if i < r {
                      z[i] = r - i
                      if z[i-l] < z[i] {
                          z[i] = z[i-l]
                      }
                  }
                  for i+z[i] < n && s[z[i]] == s[i+z[i]] {
                      z[i]++
                  }
                  if i+z[i] > r {
                      l = i
                      r = i + z[i]
                  }
                  total += z[i]
              }
              return total
          }
        `,
        kotlin: code`
          fun sumScores(s: String): Int {
              val n = s.length
              val z = IntArray(n)
              z[0] = n
              var l = 0
              var r = 0
              var total = n.toLong()
              for (i in 1 until n) {
                  if (i < r) z[i] = minOf(r - i, z[i - l])
                  while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++
                  if (i + z[i] > r) {
                      l = i
                      r = i + z[i]
                  }
                  total += z[i]
              }
              return total.toInt()
          }
        `,
        swift: code`
          func sumScores(_ s: String) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              var z = [Int](repeating: 0, count: n)
              z[0] = n
              var l = 0, r = 0, total = n
              var i = 1
              while i < n {
                  if i < r { z[i] = min(r - i, z[i - l]) }
                  while i + z[i] < n && a[z[i]] == a[i + z[i]] { z[i] += 1 }
                  if i + z[i] > r {
                      l = i
                      r = i + z[i]
                  }
                  total += z[i]
                  i += 1
              }
              return total
          }
        `,
        rust: code`
          fn sumScores(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let mut z = vec![0usize; n];
              z[0] = n;
              let (mut l, mut r) = (0usize, 0usize);
              let mut total: i64 = n as i64;
              for i in 1..n {
                  if i < r {
                      z[i] = std::cmp::min(r - i, z[i - l]);
                  }
                  while i + z[i] < n && a[z[i]] == a[i + z[i]] {
                      z[i] += 1;
                  }
                  if i + z[i] > r {
                      l = i;
                      r = i + z[i];
                  }
                  total += z[i] as i64;
              }
              total as i32
          }
        `,
        php: code`
          function sumScores($s) {
              $n = strlen($s);
              $z = array_fill(0, $n, 0);
              $z[0] = $n;
              $l = 0;
              $r = 0;
              $total = $n;
              for ($i = 1; $i < $n; $i++) {
                  if ($i < $r) $z[$i] = min($r - $i, $z[$i - $l]);
                  while ($i + $z[$i] < $n && $s[$z[$i]] === $s[$i + $z[$i]]) $z[$i]++;
                  if ($i + $z[$i] > $r) {
                      $l = $i;
                      $r = $i + $z[$i];
                  }
                  $total += $z[$i];
              }
              return $total;
          }
        `,
        ruby: code`
          def sumScores(s)
            b = s.bytes
            n = b.length
            z = Array.new(n, 0)
            z[0] = n
            l = 0
            r = 0
            total = n
            (1...n).each do |i|
              z[i] = [r - i, z[i - l]].min if i < r
              z[i] += 1 while i + z[i] < n && b[z[i]] == b[i + z[i]]
              if i + z[i] > r
                l = i
                r = i + z[i]
              end
              total += z[i]
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Total Appeal of A String (LC 2262) ──────────────────────────
  (() => {
    const ref = (s: string): number => {
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        const seen = new Set<string>();
        for (let j = i; j < s.length; j++) { seen.add(s[j]); total += seen.size; }
      }
      return total;
    };
    return {
      slug: "total-appeal-of-a-string",
      title: "Total Appeal of A String",
      difficulty: "HARD" as const,
      tags: ["String", "Hash Table", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "appealSum", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "The **appeal** of a string is the number of **distinct** characters it contains — the appeal of `\"kaika\"` is 3 (`k`, `a`, `i`).\n\n" +
        "Given `s`, return the sum of the appeals of **all** of its substrings. A substring is a contiguous, non-empty run of characters; substrings at different positions are counted separately even when they are equal.\n\n" +
        "*CodeKairo bound:* `s` is at most 10,000 characters here, so the answer always fits in a 32-bit integer.",
        [
          { in: 's = "code"', out: "20", note: "All letters differ, so every substring's appeal is its length: 4·1 + 3·2 + 2·3 + 1·4." },
          { in: 's = "aaa"', out: "6", note: "Each of the six substrings has appeal 1." },
          { in: 's = "kaika"', out: "31" },
        ],
        ["1 <= s.length <= 10^4", "s consists of lowercase English letters"]),
      hints: [
        "Flip the sum around: instead of counting distinct letters per substring, count for each position how many substrings it is the one that \"introduces\" its letter.",
        "Say a character contributes to a substring when it is the **first** occurrence of its letter inside that substring.",
        "For `s[i]` with the previous occurrence of the same letter at `prev` (or `-1`), the substring must start in `(prev, i]` and may end anywhere in `[i, n)`: that is `(i - prev) · (n - i)` substrings.",
      ],
      editorial: explain({
        idea: "Credit each distinct letter of a substring to its leftmost occurrence inside that substring. Then position `i` is credited by exactly the substrings that start after the previous copy of `s[i]` and end at or after `i`.",
        steps: [
          "Keep `last[c]`, the most recent index of letter `c`, initialised to `-1`.",
          "For each `i` with letter `c`: add `(i - last[c]) · (n - i)` to the total.",
          "Set `last[c] = i` and continue. Return the total.",
        ],
        why: "In any substring, each distinct letter has exactly one leftmost occurrence, so summing \"is the leftmost occurrence of its letter\" over all (position, substring) pairs gives the total appeal. `s[i]` is the leftmost `c` in `s[l..r]` exactly when `prev < l <= i <= r`, which is `(i - prev)` choices of `l` times `(n - i)` choices of `r`.",
        time: "O(n)",
        space: "O(1) — 26 counters",
        pitfalls: [
          "Enumerating substrings is `O(n^2)` at best — fine as a check, too slow for long strings.",
          "Crediting both the first and the last occurrence double counts letters that repeat.",
          "On the original problem (`n` up to 10^5) the answer needs 64 bits; it fits here only because of the tighter bound.",
        ],
      }),
      examples: [
        { input: '"code"', expectedOutput: "20" },
        { input: '"aaa"', expectedOutput: "6" },
        { input: '"kaika"', expectedOutput: "31" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        let s: string;
        if (kind === 0) s = randLower(rng, 1, 3);
        else if (kind <= 2) s = pick(rng, ["a", "z"]).repeat(ri(rng, 1, 50));
        else if (kind <= 5) s = randLower(rng, 1, 50, pick(rng, ["ab", "abc", "abcd"]));
        else s = randLower(rng, 1, 50);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def appealSum(s: str) -> int:
              last = [-1] * 26
              n = len(s)
              total = 0
              for i, ch in enumerate(s):
                  c = ord(ch) - 97
                  total += (i - last[c]) * (n - i)
                  last[c] = i
              return total
        `,
        javascript: code`
          var appealSum = function(s) {
              var last = new Array(26).fill(-1);
              var n = s.length, total = 0;
              for (var i = 0; i < n; i++) {
                  var c = s.charCodeAt(i) - 97;
                  total += (i - last[c]) * (n - i);
                  last[c] = i;
              }
              return total;
          };
        `,
        typescript: code`
          function appealSum(s: string): number {
              var last: number[] = [];
              for (var q = 0; q < 26; q++) last.push(-1);
              var n = s.length, total = 0;
              for (var i = 0; i < n; i++) {
                  var c = s.charCodeAt(i) - 97;
                  total += (i - last[c]) * (n - i);
                  last[c] = i;
              }
              return total;
          }
        `,
        java: code`
          public static int appealSum(String s) {
              int[] last = new int[26];
              Arrays.fill(last, -1);
              int n = s.length();
              long total = 0;
              for (int i = 0; i < n; i++) {
                  int c = s.charAt(i) - 'a';
                  total += (long) (i - last[c]) * (n - i);
                  last[c] = i;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int appealSum(string s) {
              vector<int> last(26, -1);
              int n = s.size();
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  int c = s[i] - 'a';
                  total += (long long)(i - last[c]) * (n - i);
                  last[c] = i;
              }
              return (int)total;
          }
        `,
        c: code`
          int appealSum(const char* s) {
              int last[26];
              for (int q = 0; q < 26; q++) last[q] = -1;
              int n = (int)strlen(s);
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  int c = s[i] - 'a';
                  total += (long long)(i - last[c]) * (n - i);
                  last[c] = i;
              }
              return (int)total;
          }
        `,
        csharp: code`
          public static int AppealSum(string s)
          {
              var last = new int[26];
              for (int q = 0; q < 26; q++) last[q] = -1;
              int n = s.Length;
              long total = 0;
              for (int i = 0; i < n; i++)
              {
                  int c = s[i] - 'a';
                  total += (long)(i - last[c]) * (n - i);
                  last[c] = i;
              }
              return (int)total;
          }
        `,
        go: code`
          func appealSum(s string) int {
              last := make([]int, 26)
              for q := range last {
                  last[q] = -1
              }
              n, total := len(s), 0
              for i := 0; i < n; i++ {
                  c := int(s[i] - 'a')
                  total += (i - last[c]) * (n - i)
                  last[c] = i
              }
              return total
          }
        `,
        kotlin: code`
          fun appealSum(s: String): Int {
              val last = IntArray(26) { -1 }
              val n = s.length
              var total = 0L
              for (i in 0 until n) {
                  val c = s[i] - 'a'
                  total += (i - last[c]).toLong() * (n - i)
                  last[c] = i
              }
              return total.toInt()
          }
        `,
        swift: code`
          func appealSum(_ s: String) -> Int {
              var last = [Int](repeating: -1, count: 26)
              let a = Array(s.utf8)
              let n = a.count
              var total = 0
              for i in 0..<n {
                  let c = Int(a[i]) - 97
                  total += (i - last[c]) * (n - i)
                  last[c] = i
              }
              return total
          }
        `,
        rust: code`
          fn appealSum(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len() as i64;
              let mut last = [-1i64; 26];
              let mut total: i64 = 0;
              for (i, &ch) in a.iter().enumerate() {
                  let c = (ch - b'a') as usize;
                  let ii = i as i64;
                  total += (ii - last[c]) * (n - ii);
                  last[c] = ii;
              }
              total as i32
          }
        `,
        php: code`
          function appealSum($s) {
              $last = array_fill(0, 26, -1);
              $n = strlen($s);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  $c = ord($s[$i]) - 97;
                  $total += ($i - $last[$c]) * ($n - $i);
                  $last[$c] = $i;
              }
              return $total;
          }
        `,
        ruby: code`
          def appealSum(s)
            last = Array.new(26, -1)
            n = s.length
            total = 0
            s.each_byte.with_index do |ch, i|
              c = ch - 97
              total += (i - last[c]) * (n - i)
              last[c] = i
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Naming a Company (LC 2306) ──────────────────────────────────
  (() => {
    const ref = (ideas: string[]): number => {
      const set = new Set(ideas);
      let count = 0;
      for (const a of ideas) {
        for (const b of ideas) {
          if (a === b) continue;
          if (!set.has(b[0] + a.slice(1)) && !set.has(a[0] + b.slice(1))) count++;
        }
      }
      return count;
    };
    return {
      slug: "naming-a-company",
      title: "Naming a Company",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "String", "Bit Manipulation", "Enumeration", "Google", "Amazon"],
      signature: { funcName: "distinctNames", params: [{ name: "ideas", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "A start-up brainstorms a list of **distinct** single-word `ideas` and builds two-word company names from them like this:\n\n" +
        "1. Pick two different ideas `ideaA` and `ideaB` (order matters).\n" +
        "2. Swap their first letters.\n" +
        "3. If **neither** of the two new words appears in `ideas`, the name `ideaA ideaB` (the two new words joined by a space) is valid.\n\n" +
        "Return the number of **distinct** valid company names.\n\n" +
        "*CodeKairo bound:* at most 40,000 ideas here, so the answer always fits in a 32-bit integer.",
        [
          {
            in: 'ideas = ["code","kairo","duel","kata"]', out: "10",
            note: "For example `code` + `kairo` gives `kode cairo`, valid because neither word is an idea. Only pairs that share a suffix such as `kata`/`kairo` (both starting with `k`) fail.",
          },
          { in: 'ideas = ["lack","back"]', out: "0", note: "Swapping gives back the same two words, which are ideas." },
          { in: 'ideas = ["bat","cat","rat","bee","see"]', out: "4" },
        ],
        [
          "2 <= ideas.length <= 4 * 10^4",
          "1 <= ideas[i].length <= 10",
          "ideas[i] consists of lowercase English letters",
          "All the strings in ideas are unique",
        ]),
      hints: [
        "Only the first letter and the rest of the word (the suffix) matter. Group the suffixes by first letter.",
        "Take ideas with first letters `a != b` and suffixes `x` and `y`. The swap is valid exactly when `x` is not in group `b` and `y` is not in group `a`.",
        "So for each ordered pair of letters, the count is `(|G_a| - common) · (|G_b| - common)`, where `common` is the number of suffixes in both groups. Count `common` for all 26 × 26 pairs at once by recording, for each suffix, the set of first letters it appears with.",
      ],
      editorial: explain({
        idea: "A swap between an idea in group `a` and one in group `b` (grouped by first letter) works iff each suffix is missing from the other group. Same-letter pairs never work. So the answer is a sum over 26 × 26 letter pairs of products of \"suffixes not shared\" counts.",
        steps: [
          "Count `cnt[a]`, the number of ideas starting with each letter.",
          "Map every suffix (the idea without its first letter) to a 26-bit mask of the first letters it occurs with.",
          "For every suffix mask and every pair of letters `a, b` in that mask, increment `common[a][b]`.",
          "Sum `(cnt[a] - common[a][b]) · (cnt[b] - common[a][b])` over all ordered pairs `a != b`.",
        ],
        why: "Picking `a·x` and `b·y` yields the words `b·x` and `a·y`; they are new iff `x ∉ G_b` and `y ∉ G_a`. The two conditions are independent, so the number of valid pairs for letters `(a, b)` is the product of `|G_a \\ G_b|` and `|G_b \\ G_a|`, and `|G_a \\ G_b| = cnt[a] - common[a][b]`. For `a == b` the swap returns the original ideas, so those pairs contribute nothing. Different idea pairs give different names, so counting pairs counts names.",
        time: "O(n · L + 26^2) — plus the squared size of each suffix's letter set, at most 26 · n in total",
        space: "O(n · L)",
        pitfalls: [
          "Checking every pair of ideas is `O(n^2)` — 1.6 · 10^9 checks at the upper bound.",
          "The order of the pair matters: `ideaA ideaB` and `ideaB ideaA` are different names.",
          "On the original problem (`n` up to 5 · 10^4) the count needs 64 bits; it fits here only because of the tighter bound.",
        ],
      }),
      examples: [
        { input: '["code","kairo","duel","kata"]', expectedOutput: "10" },
        { input: '["lack","back"]', expectedOutput: "0" },
        { input: '["bat","cat","rat","bee","see"]', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const letters = shuffle(rng, "abcdefgz".split("")).slice(0, ri(rng, 1, 6)).join("");
        const sufAlpha = pick(rng, ["a", "ab", "abc", "xyz"]);
        const target = ri(rng, 2, pick(rng, [4, 12, 30]));
        const seen = new Set<string>();
        let guard = 0;
        while (seen.size < target && guard++ < 400) {
          const w = letters[ri(rng, 0, letters.length - 1)] + randLower(rng, 0, 3, sufAlpha);
          seen.add(w);
        }
        if (seen.size < 2) { seen.add("q"); seen.add("qq"); }
        const ideas = shuffle(rng, [...seen]);
        return { input: fmtStrArr(ideas), expectedOutput: String(ref(ideas)) };
      },
      solutions: {
        python: code`
          from typing import List

          def distinctNames(ideas: List[str]) -> int:
              cnt = [0] * 26
              masks = {}
              for w in ideas:
                  c = ord(w[0]) - 97
                  cnt[c] += 1
                  suf = w[1:]
                  masks[suf] = masks.get(suf, 0) | (1 << c)
              common = [[0] * 26 for _ in range(26)]
              for m in masks.values():
                  bits = [b for b in range(26) if (m >> b) & 1]
                  for a in bits:
                      row = common[a]
                      for b in bits:
                          row[b] += 1
              total = 0
              for a in range(26):
                  for b in range(26):
                      if a != b:
                          total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b])
              return total
        `,
        javascript: code`
          var distinctNames = function(ideas) {
              var cnt = new Array(26).fill(0);
              var masks = new Map();
              for (var i = 0; i < ideas.length; i++) {
                  var w = ideas[i];
                  var c = w.charCodeAt(0) - 97;
                  cnt[c]++;
                  var suf = w.substring(1);
                  var prev = masks.get(suf);
                  masks.set(suf, (prev === undefined ? 0 : prev) | (1 << c));
              }
              var common = [];
              for (var a = 0; a < 26; a++) common.push(new Array(26).fill(0));
              masks.forEach(function(m) {
                  for (var x = 0; x < 26; x++) {
                      if (((m >> x) & 1) === 0) continue;
                      for (var y = 0; y < 26; y++) if ((m >> y) & 1) common[x][y]++;
                  }
              });
              var total = 0;
              for (var p = 0; p < 26; p++) {
                  for (var q = 0; q < 26; q++) {
                      if (p !== q) total += (cnt[p] - common[p][q]) * (cnt[q] - common[p][q]);
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function distinctNames(ideas: string[]): number {
              var cnt: number[] = [];
              for (var k = 0; k < 26; k++) cnt.push(0);
              var masks: { [k: string]: number } = {};
              for (var i = 0; i < ideas.length; i++) {
                  var w = ideas[i];
                  var c = w.charCodeAt(0) - 97;
                  cnt[c]++;
                  var key = "#" + w.substring(1);
                  masks[key] = (masks.hasOwnProperty(key) ? masks[key] : 0) | (1 << c);
              }
              var common: number[][] = [];
              for (var a = 0; a < 26; a++) {
                  var row: number[] = [];
                  for (var b = 0; b < 26; b++) row.push(0);
                  common.push(row);
              }
              for (var key2 in masks) {
                  if (!masks.hasOwnProperty(key2)) continue;
                  var m = masks[key2];
                  for (var x = 0; x < 26; x++) {
                      if (((m >> x) & 1) === 0) continue;
                      for (var y = 0; y < 26; y++) if ((m >> y) & 1) common[x][y]++;
                  }
              }
              var total = 0;
              for (var p = 0; p < 26; p++) {
                  for (var q = 0; q < 26; q++) {
                      if (p !== q) total += (cnt[p] - common[p][q]) * (cnt[q] - common[p][q]);
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int distinctNames(String[] ideas) {
              long[] cnt = new long[26];
              Map<String, Integer> masks = new HashMap<>();
              for (String w : ideas) {
                  int c = w.charAt(0) - 'a';
                  cnt[c]++;
                  masks.merge(w.substring(1), 1 << c, (x, y) -> x | y);
              }
              long[][] common = new long[26][26];
              for (int m : masks.values()) {
                  for (int a = 0; a < 26; a++) {
                      if (((m >> a) & 1) == 0) continue;
                      for (int b = 0; b < 26; b++) if (((m >> b) & 1) != 0) common[a][b]++;
                  }
              }
              long total = 0;
              for (int a = 0; a < 26; a++) {
                  for (int b = 0; b < 26; b++) {
                      if (a != b) total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b]);
                  }
              }
              return (int) total;
          }
        `,
        cpp: code`
          int distinctNames(vector<string>& ideas) {
              long long cnt[26] = {0};
              unordered_map<string, int> masks;
              for (const string& w : ideas) {
                  int c = w[0] - 'a';
                  cnt[c]++;
                  masks[w.substr(1)] |= 1 << c;
              }
              vector<vector<long long>> common(26, vector<long long>(26, 0));
              for (auto& kv : masks) {
                  int m = kv.second;
                  for (int a = 0; a < 26; a++) {
                      if (!((m >> a) & 1)) continue;
                      for (int b = 0; b < 26; b++) if ((m >> b) & 1) common[a][b]++;
                  }
              }
              long long total = 0;
              for (int a = 0; a < 26; a++) {
                  for (int b = 0; b < 26; b++) {
                      if (a != b) total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b]);
                  }
              }
              return (int)total;
          }
        `,
        c: code`
          static char** dnIdeas;

          static int dnCmp(const void* x, const void* y) {
              return strcmp(dnIdeas[*(const int*)x] + 1, dnIdeas[*(const int*)y] + 1);
          }

          int distinctNames(char** ideas, int ideasSize) {
              dnIdeas = ideas;
              long long cnt[26];
              long long common[26][26];
              memset(cnt, 0, sizeof(cnt));
              memset(common, 0, sizeof(common));
              int* order = (int*)malloc(sizeof(int) * ideasSize);
              for (int i = 0; i < ideasSize; i++) {
                  order[i] = i;
                  cnt[ideas[i][0] - 'a']++;
              }
              qsort(order, ideasSize, sizeof(int), dnCmp);
              int i = 0;
              while (i < ideasSize) {
                  int j = i, mask = 0;
                  while (j < ideasSize && strcmp(ideas[order[j]] + 1, ideas[order[i]] + 1) == 0) {
                      mask |= 1 << (ideas[order[j]][0] - 'a');
                      j++;
                  }
                  for (int a = 0; a < 26; a++) {
                      if (!((mask >> a) & 1)) continue;
                      for (int b = 0; b < 26; b++) if ((mask >> b) & 1) common[a][b]++;
                  }
                  i = j;
              }
              free(order);
              long long total = 0;
              for (int a = 0; a < 26; a++) {
                  for (int b = 0; b < 26; b++) {
                      if (a != b) total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b]);
                  }
              }
              return (int)total;
          }
        `,
        csharp: code`
          public static int DistinctNames(string[] ideas)
          {
              var cnt = new long[26];
              var masks = new Dictionary<string, int>();
              foreach (var w in ideas)
              {
                  int c = w[0] - 'a';
                  cnt[c]++;
                  string suf = w.Substring(1);
                  masks.TryGetValue(suf, out int prev);
                  masks[suf] = prev | (1 << c);
              }
              var common = new long[26, 26];
              foreach (int m in masks.Values)
              {
                  for (int a = 0; a < 26; a++)
                  {
                      if (((m >> a) & 1) == 0) continue;
                      for (int b = 0; b < 26; b++) if (((m >> b) & 1) != 0) common[a, b]++;
                  }
              }
              long total = 0;
              for (int a = 0; a < 26; a++)
              {
                  for (int b = 0; b < 26; b++)
                  {
                      if (a != b) total += (cnt[a] - common[a, b]) * (cnt[b] - common[a, b]);
                  }
              }
              return (int)total;
          }
        `,
        go: code`
          func distinctNames(ideas []string) int {
              cnt := make([]int, 26)
              masks := map[string]int{}
              for _, w := range ideas {
                  c := uint(w[0] - 'a')
                  cnt[c]++
                  masks[w[1:]] |= 1 << c
              }
              common := make([][]int, 26)
              for a := range common {
                  common[a] = make([]int, 26)
              }
              for _, m := range masks {
                  for a := uint(0); a < 26; a++ {
                      if (m>>a)&1 == 0 {
                          continue
                      }
                      for b := uint(0); b < 26; b++ {
                          if (m>>b)&1 == 1 {
                              common[a][b]++
                          }
                      }
                  }
              }
              total := 0
              for a := 0; a < 26; a++ {
                  for b := 0; b < 26; b++ {
                      if a != b {
                          total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b])
                      }
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun distinctNames(ideas: Array<String>): Int {
              val cnt = LongArray(26)
              val masks = HashMap<String, Int>()
              for (w in ideas) {
                  val c = w[0] - 'a'
                  cnt[c]++
                  val suf = w.substring(1)
                  masks[suf] = (masks[suf] ?: 0) or (1 shl c)
              }
              val common = Array(26) { LongArray(26) }
              for (m in masks.values) {
                  for (a in 0 until 26) {
                      if (((m shr a) and 1) == 0) continue
                      for (b in 0 until 26) if (((m shr b) and 1) == 1) common[a][b]++
                  }
              }
              var total = 0L
              for (a in 0 until 26) {
                  for (b in 0 until 26) {
                      if (a != b) total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b])
                  }
              }
              return total.toInt()
          }
        `,
        swift: code`
          func distinctNames(_ ideas: [String]) -> Int {
              var cnt = [Int](repeating: 0, count: 26)
              var masks = [String: Int]()
              for w in ideas {
                  let c = Int(w.utf8.first!) - 97
                  cnt[c] += 1
                  let suf = String(w.dropFirst())
                  masks[suf, default: 0] |= 1 << c
              }
              var common = [[Int]](repeating: [Int](repeating: 0, count: 26), count: 26)
              for m in masks.values {
                  for a in 0..<26 {
                      if (m >> a) & 1 == 0 { continue }
                      for b in 0..<26 where (m >> b) & 1 == 1 {
                          common[a][b] += 1
                      }
                  }
              }
              var total = 0
              for a in 0..<26 {
                  for b in 0..<26 where a != b {
                      total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b])
                  }
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn distinctNames(ideas: Vec<String>) -> i32 {
              let mut cnt = [0i64; 26];
              let mut masks: HashMap<&str, u32> = HashMap::new();
              for w in ideas.iter() {
                  let c = (w.as_bytes()[0] - b'a') as usize;
                  cnt[c] += 1;
                  *masks.entry(&w[1..]).or_insert(0) |= 1u32 << c;
              }
              let mut common = [[0i64; 26]; 26];
              for (_, &m) in masks.iter() {
                  for a in 0..26 {
                      if (m >> a) & 1 == 0 {
                          continue;
                      }
                      for b in 0..26 {
                          if (m >> b) & 1 == 1 {
                              common[a][b] += 1;
                          }
                      }
                  }
              }
              let mut total: i64 = 0;
              for a in 0..26 {
                  for b in 0..26 {
                      if a != b {
                          total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b]);
                      }
                  }
              }
              total as i32
          }
        `,
        php: code`
          function distinctNames($ideas) {
              $cnt = array_fill(0, 26, 0);
              $masks = [];
              foreach ($ideas as $w) {
                  $c = ord($w[0]) - 97;
                  $cnt[$c]++;
                  $key = "#" . substr($w, 1);
                  $masks[$key] = (isset($masks[$key]) ? $masks[$key] : 0) | (1 << $c);
              }
              $common = array_fill(0, 26, array_fill(0, 26, 0));
              foreach ($masks as $m) {
                  for ($a = 0; $a < 26; $a++) {
                      if ((($m >> $a) & 1) == 0) continue;
                      for ($b = 0; $b < 26; $b++) if (($m >> $b) & 1) $common[$a][$b]++;
                  }
              }
              $total = 0;
              for ($a = 0; $a < 26; $a++) {
                  for ($b = 0; $b < 26; $b++) {
                      if ($a != $b) $total += ($cnt[$a] - $common[$a][$b]) * ($cnt[$b] - $common[$a][$b]);
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def distinctNames(ideas)
            cnt = Array.new(26, 0)
            masks = Hash.new(0)
            ideas.each do |w|
              c = w.getbyte(0) - 97
              cnt[c] += 1
              masks[w[1..-1]] |= 1 << c
            end
            common = Array.new(26) { Array.new(26, 0) }
            masks.each_value do |m|
              bits = (0...26).select { |b| (m >> b) & 1 == 1 }
              bits.each do |a|
                bits.each { |b| common[a][b] += 1 }
              end
            end
            total = 0
            26.times do |a|
              26.times do |b|
                next if a == b
                total += (cnt[a] - common[a][b]) * (cnt[b] - common[a][b])
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Sum of Prefix Scores of Strings (LC 2416) ───────────────────
  (() => {
    const ref = (words: string[]): number[] =>
      words.map((w) => {
        let total = 0;
        for (let len = 1; len <= w.length; len++) {
          const p = w.slice(0, len);
          for (const x of words) if (x.startsWith(p)) total++;
        }
        return total;
      });
    return {
      slug: "sum-of-prefix-scores-of-strings",
      title: "Sum of Prefix Scores of Strings",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Trie", "Counting", "Amazon", "Google"],
      signature: { funcName: "sumPrefixScores", params: [{ name: "words", type: "string[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `words` of `n` non-empty strings. The **score** of a string `p` is the number of strings in `words` that have `p` as a prefix (a string is a prefix of itself).\n\n" +
        "For each `words[i]`, add up the scores of **every non-empty prefix** of `words[i]`. Return the array `answer` of length `n` where `answer[i]` is that sum.",
        [
          {
            in: 'words = ["code","coder","cod","kairo"]', out: "[11,12,9,5]",
            note: "For `code`: `c`, `co` and `cod` each prefix three words and `code` prefixes two, so 3 + 3 + 3 + 2 = 11.",
          },
          { in: 'words = ["aa","a","aa"]', out: "[5,3,5]", note: "Equal words are counted separately." },
          { in: 'words = ["xyz"]', out: "[3]" },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length <= 1000", "words[i] consists of lowercase English letters"]),
      hints: [
        "The score of a prefix is \"how many words pass through this prefix\" — a trie stores exactly that if each node keeps a counter.",
        "Insert every word, incrementing the counter of each node on its path.",
        "Then walk each word's path again and add up the counters it visits.",
      ],
      editorial: explain({
        idea: "In a trie, each node is one distinct prefix. Counting how many inserted words pass through a node gives that prefix's score directly, so each answer is the sum of the counters along the word's own path.",
        steps: [
          "Build a trie; give every node a counter `pass`.",
          "Insert each word: walk/create its path from the root, incrementing `pass` on every node after the root.",
          "For each word, walk its path again and sum the `pass` values — that is the answer for the word.",
        ],
        why: "A word `w` has `p` as a prefix exactly when `w`'s path goes through `p`'s node, so after all insertions `pass[p]` equals the score of `p`. The prefixes of `words[i]` are exactly the nodes on its path, so the sum along that path is the requested total.",
        time: "O(total length of all words)",
        space: "O(26 · total length) for the trie",
        pitfalls: [
          "Comparing every prefix with every word is `O(n^2 · L)` — up to 10^9 character checks.",
          "Duplicate words must each be counted; do not deduplicate before inserting.",
          "A per-node array of 26 children is simplest; store the trie in flat arrays to keep allocation cheap.",
        ],
      }),
      examples: [
        { input: '["code","coder","cod","kairo"]', expectedOutput: "[11,12,9,5]" },
        { input: '["aa","a","aa"]', expectedOutput: "[5,3,5]" },
        { input: '["xyz"]', expectedOutput: "[3]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const n = ri(rng, 1, pick(rng, [3, 10, 25]));
        const words: string[] = [];
        for (let i = 0; i < n; i++) {
          if (words.length && rng() < 0.4) {
            const base = pick(rng, words);
            words.push((base.slice(0, ri(rng, 1, base.length)) + randLower(rng, 0, 3, alpha)).slice(0, 10));
          } else words.push(randLower(rng, 1, 8, alpha));
        }
        return { input: fmtStrArr(words), expectedOutput: fmtIntArr(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumPrefixScores(words: List[str]) -> List[int]:
              nxt = [[0] * 26]
              cnt = [0]
              for w in words:
                  node = 0
                  for ch in w:
                      c = ord(ch) - 97
                      if nxt[node][c] == 0:
                          nxt[node][c] = len(nxt)
                          nxt.append([0] * 26)
                          cnt.append(0)
                      node = nxt[node][c]
                      cnt[node] += 1
              res = []
              for w in words:
                  node = 0
                  total = 0
                  for ch in w:
                      node = nxt[node][ord(ch) - 97]
                      total += cnt[node]
                  res.append(total)
              return res
        `,
        javascript: code`
          var sumPrefixScores = function(words) {
              var total = 1;
              for (var i = 0; i < words.length; i++) total += words[i].length;
              var child = new Int32Array(total * 26);
              var cnt = new Int32Array(total);
              var nodes = 1;
              for (var i2 = 0; i2 < words.length; i2++) {
                  var w = words[i2], node = 0;
                  for (var j = 0; j < w.length; j++) {
                      var c = w.charCodeAt(j) - 97;
                      if (child[node * 26 + c] === 0) child[node * 26 + c] = nodes++;
                      node = child[node * 26 + c];
                      cnt[node]++;
                  }
              }
              var res = [];
              for (var i3 = 0; i3 < words.length; i3++) {
                  var w2 = words[i3], node2 = 0, sum = 0;
                  for (var k = 0; k < w2.length; k++) {
                      node2 = child[node2 * 26 + w2.charCodeAt(k) - 97];
                      sum += cnt[node2];
                  }
                  res.push(sum);
              }
              return res;
          };
        `,
        typescript: code`
          function sumPrefixScores(words: string[]): number[] {
              var total = 1;
              for (var i = 0; i < words.length; i++) total += words[i].length;
              var child: number[] = [];
              for (var q = 0; q < total * 26; q++) child.push(0);
              var cnt: number[] = [];
              for (var q2 = 0; q2 < total; q2++) cnt.push(0);
              var nodes = 1;
              for (var i2 = 0; i2 < words.length; i2++) {
                  var w = words[i2], node = 0;
                  for (var j = 0; j < w.length; j++) {
                      var c = w.charCodeAt(j) - 97;
                      if (child[node * 26 + c] === 0) child[node * 26 + c] = nodes++;
                      node = child[node * 26 + c];
                      cnt[node]++;
                  }
              }
              var res: number[] = [];
              for (var i3 = 0; i3 < words.length; i3++) {
                  var w2 = words[i3], node2 = 0, sum = 0;
                  for (var k = 0; k < w2.length; k++) {
                      node2 = child[node2 * 26 + w2.charCodeAt(k) - 97];
                      sum += cnt[node2];
                  }
                  res.push(sum);
              }
              return res;
          }
        `,
        java: code`
          public static int[] sumPrefixScores(String[] words) {
              int total = 1;
              for (String w : words) total += w.length();
              int[] child = new int[total * 26];
              int[] cnt = new int[total];
              int nodes = 1;
              for (String w : words) {
                  int node = 0;
                  for (int j = 0; j < w.length(); j++) {
                      int c = w.charAt(j) - 'a';
                      if (child[node * 26 + c] == 0) child[node * 26 + c] = nodes++;
                      node = child[node * 26 + c];
                      cnt[node]++;
                  }
              }
              int[] res = new int[words.length];
              for (int i = 0; i < words.length; i++) {
                  int node = 0, sum = 0;
                  for (int j = 0; j < words[i].length(); j++) {
                      node = child[node * 26 + words[i].charAt(j) - 'a'];
                      sum += cnt[node];
                  }
                  res[i] = sum;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> sumPrefixScores(vector<string>& words) {
              int total = 1;
              for (const string& w : words) total += w.size();
              vector<int> child(total * 26, 0), cnt(total, 0);
              int nodes = 1;
              for (const string& w : words) {
                  int node = 0;
                  for (char ch : w) {
                      int c = ch - 'a';
                      if (child[node * 26 + c] == 0) child[node * 26 + c] = nodes++;
                      node = child[node * 26 + c];
                      cnt[node]++;
                  }
              }
              vector<int> res;
              for (const string& w : words) {
                  int node = 0, sum = 0;
                  for (char ch : w) {
                      node = child[node * 26 + (ch - 'a')];
                      sum += cnt[node];
                  }
                  res.push_back(sum);
              }
              return res;
          }
        `,
        c: code`
          int* sumPrefixScores(char** words, int wordsSize, int* returnSize) {
              int total = 1;
              for (int i = 0; i < wordsSize; i++) total += (int)strlen(words[i]);
              int* child = (int*)calloc((size_t)total * 26, sizeof(int));
              int* cnt = (int*)calloc(total, sizeof(int));
              int nodes = 1;
              for (int i = 0; i < wordsSize; i++) {
                  int node = 0;
                  for (const char* p = words[i]; *p; p++) {
                      int c = *p - 'a';
                      if (child[node * 26 + c] == 0) child[node * 26 + c] = nodes++;
                      node = child[node * 26 + c];
                      cnt[node]++;
                  }
              }
              int* res = (int*)malloc(sizeof(int) * (wordsSize > 0 ? wordsSize : 1));
              for (int i = 0; i < wordsSize; i++) {
                  int node = 0, sum = 0;
                  for (const char* p = words[i]; *p; p++) {
                      node = child[node * 26 + (*p - 'a')];
                      sum += cnt[node];
                  }
                  res[i] = sum;
              }
              free(child);
              free(cnt);
              *returnSize = wordsSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] SumPrefixScores(string[] words)
          {
              int total = 1;
              foreach (var w in words) total += w.Length;
              var child = new int[total * 26];
              var cnt = new int[total];
              int nodes = 1;
              foreach (var w in words)
              {
                  int node = 0;
                  foreach (char ch in w)
                  {
                      int c = ch - 'a';
                      if (child[node * 26 + c] == 0) child[node * 26 + c] = nodes++;
                      node = child[node * 26 + c];
                      cnt[node]++;
                  }
              }
              var res = new int[words.Length];
              for (int i = 0; i < words.Length; i++)
              {
                  int node = 0, sum = 0;
                  foreach (char ch in words[i])
                  {
                      node = child[node * 26 + (ch - 'a')];
                      sum += cnt[node];
                  }
                  res[i] = sum;
              }
              return res;
          }
        `,
        go: code`
          func sumPrefixScores(words []string) []int {
              total := 1
              for _, w := range words {
                  total += len(w)
              }
              child := make([]int, total*26)
              cnt := make([]int, total)
              nodes := 1
              for _, w := range words {
                  node := 0
                  for j := 0; j < len(w); j++ {
                      c := int(w[j] - 'a')
                      if child[node*26+c] == 0 {
                          child[node*26+c] = nodes
                          nodes++
                      }
                      node = child[node*26+c]
                      cnt[node]++
                  }
              }
              res := make([]int, len(words))
              for i, w := range words {
                  node, sum := 0, 0
                  for j := 0; j < len(w); j++ {
                      node = child[node*26+int(w[j]-'a')]
                      sum += cnt[node]
                  }
                  res[i] = sum
              }
              return res
          }
        `,
        kotlin: code`
          fun sumPrefixScores(words: Array<String>): IntArray {
              var total = 1
              for (w in words) total += w.length
              val child = IntArray(total * 26)
              val cnt = IntArray(total)
              var nodes = 1
              for (w in words) {
                  var node = 0
                  for (ch in w) {
                      val c = ch - 'a'
                      if (child[node * 26 + c] == 0) child[node * 26 + c] = nodes++
                      node = child[node * 26 + c]
                      cnt[node]++
                  }
              }
              val res = IntArray(words.size)
              for (i in words.indices) {
                  var node = 0
                  var sum = 0
                  for (ch in words[i]) {
                      node = child[node * 26 + (ch - 'a')]
                      sum += cnt[node]
                  }
                  res[i] = sum
              }
              return res
          }
        `,
        swift: code`
          func sumPrefixScores(_ words: [String]) -> [Int] {
              let bytes = words.map { Array($0.utf8) }
              var total = 1
              for w in bytes { total += w.count }
              var child = [Int](repeating: 0, count: total * 26)
              var cnt = [Int](repeating: 0, count: total)
              var nodes = 1
              for w in bytes {
                  var node = 0
                  for ch in w {
                      let c = Int(ch) - 97
                      if child[node * 26 + c] == 0 {
                          child[node * 26 + c] = nodes
                          nodes += 1
                      }
                      node = child[node * 26 + c]
                      cnt[node] += 1
                  }
              }
              var res: [Int] = []
              for w in bytes {
                  var node = 0, sum = 0
                  for ch in w {
                      node = child[node * 26 + Int(ch) - 97]
                      sum += cnt[node]
                  }
                  res.append(sum)
              }
              return res
          }
        `,
        rust: code`
          fn sumPrefixScores(words: Vec<String>) -> Vec<i32> {
              let mut total = 1usize;
              for w in words.iter() {
                  total += w.len();
              }
              let mut child = vec![0usize; total * 26];
              let mut cnt = vec![0i32; total];
              let mut nodes = 1usize;
              for w in words.iter() {
                  let mut node = 0usize;
                  for &ch in w.as_bytes().iter() {
                      let c = (ch - b'a') as usize;
                      if child[node * 26 + c] == 0 {
                          child[node * 26 + c] = nodes;
                          nodes += 1;
                      }
                      node = child[node * 26 + c];
                      cnt[node] += 1;
                  }
              }
              let mut res: Vec<i32> = Vec::new();
              for w in words.iter() {
                  let mut node = 0usize;
                  let mut sum = 0i32;
                  for &ch in w.as_bytes().iter() {
                      node = child[node * 26 + (ch - b'a') as usize];
                      sum += cnt[node];
                  }
                  res.push(sum);
              }
              res
          }
        `,
        php: code`
          function sumPrefixScores($words) {
              $child = [[]];
              $cnt = [0];
              foreach ($words as $w) {
                  $node = 0;
                  $len = strlen($w);
                  for ($j = 0; $j < $len; $j++) {
                      $c = $w[$j];
                      if (!isset($child[$node][$c])) {
                          $child[$node][$c] = count($cnt);
                          $child[] = [];
                          $cnt[] = 0;
                      }
                      $node = $child[$node][$c];
                      $cnt[$node]++;
                  }
              }
              $res = [];
              foreach ($words as $w) {
                  $node = 0;
                  $sum = 0;
                  $len = strlen($w);
                  for ($j = 0; $j < $len; $j++) {
                      $node = $child[$node][$w[$j]];
                      $sum += $cnt[$node];
                  }
                  $res[] = $sum;
              }
              return $res;
          }
        `,
        ruby: code`
          def sumPrefixScores(words)
            child = [Array.new(26, 0)]
            cnt = [0]
            words.each do |w|
              node = 0
              w.each_byte do |ch|
                c = ch - 97
                if child[node][c] == 0
                  child[node][c] = child.length
                  child << Array.new(26, 0)
                  cnt << 0
                end
                node = child[node][c]
                cnt[node] += 1
              end
            end
            words.map do |w|
              node = 0
              sum = 0
              w.each_byte do |ch|
                node = child[node][ch - 97]
                sum += cnt[node]
              end
              sum
            end
          end
        `,
      },
    };
  })(),

  // ── Count Palindromic Subsequences (LC 2484) ────────────────────
  (() => {
    const MOD = 1000000007;
    // Fix the matching pair (j, l) of positions 2 and 4: any middle in between,
    // and an outer pair of equal digits around it — independent of the
    // prefix/suffix pair-count solutions.
    const ref = (s: string): number => {
      const n = s.length;
      const d = s.split("").map((c) => c.charCodeAt(0) - 48);
      const before: number[][] = [new Array(10).fill(0)];
      for (let i = 0; i < n; i++) { const row = before[i].slice(); row[d[i]]++; before.push(row); }
      let total = 0;
      for (let j = 0; j < n; j++) {
        for (let l = j + 2; l < n; l++) {
          if (d[j] !== d[l]) continue;
          let outer = 0;
          for (let x = 0; x < 10; x++) outer += before[j][x] * (before[n][x] - before[l + 1][x]);
          total += (l - j - 1) * outer;
        }
      }
      return total % MOD;
    };
    return {
      slug: "count-palindromic-subsequences",
      title: "Count Palindromic Subsequences",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Counting", "Amazon", "Google"],
      signature: { funcName: "countPalindromes", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string of digits `s`, return the number of **palindromic subsequences of length 5**. Since the answer can be very large, return it **modulo** `10^9 + 7`.\n\n" +
        "A subsequence is obtained by deleting zero or more characters without changing the order of the rest; two subsequences are different when they use different sets of **indices**, even if they spell the same digits. A palindrome reads the same forwards and backwards.",
        [
          { in: 's = "12321"', out: "1", note: "The only choice is the whole string." },
          { in: 's = "0000000"', out: "21", note: "Any 5 of the 7 positions work: C(7, 5) = 21." },
          { in: 's = "2026202"', out: "5" },
        ],
        ["1 <= s.length <= 10^4", "s consists of digits"]),
      hints: [
        "A length-5 palindrome has the shape `a b c b a`. Fix the position of the middle character `c` — it can be anything.",
        "Left of the middle you need the number of index pairs `i < j` spelling `a b`; right of it, the number of pairs `l < m` spelling `b a`. Multiply and sum over the 100 choices of `(a, b)`.",
        "Maintain those pair counts incrementally as the middle sweeps left to right: adding a digit `c` to the left side adds `count_left[a]` new pairs `(a, c)` for every `a`; removing a digit from the right side is the mirror image.",
      ],
      editorial: explain({
        idea: "With only ten digits, a length-5 palindrome `a b c b a` is determined around its middle by a pair `(a, b)`. Keep, for the prefix before the middle and the suffix after it, the number of index pairs spelling each of the 100 two-digit patterns; each middle then contributes `Σ pre[a][b] · suf[b][a]`.",
        steps: [
          "Precompute the suffix structures for the whole string: `sufCnt[x]` (digit counts) and `sufPair[b][a]` (pairs `l < m` with `s[l] = b`, `s[m] = a`), filled by scanning from the right: at digit `b`, add `sufCnt[a]` to `sufPair[b][a]` for every `a`, then increment `sufCnt[b]`.",
          "Sweep the middle `k` from left to right. First remove index `k` from the suffix: decrement `sufCnt[s[k]]`, then subtract `sufCnt[a]` from `sufPair[s[k]][a]` for every `a`.",
          "Add `Σ_{a,b} prePair[a][b] · sufPair[b][a]` to the answer (reduce modulo `10^9 + 7`).",
          "Add index `k` to the prefix: for every `a`, add `preCnt[a]` to `prePair[a][s[k]]`; then increment `preCnt[s[k]]`.",
        ],
        why: "Every length-5 palindromic subsequence has a unique middle index `k`, an outer-and-inner pair `(i, j)` before it spelling `a b`, and a pair `(l, m)` after it spelling `b a` — and any such choice yields a palindrome. So the count for middle `k` is exactly the sum of products over `(a, b)`. The incremental updates keep `pre*` describing indices `< k` and `suf*` describing indices `> k` at the moment the middle is evaluated.",
        time: "O(100 · n)",
        space: "O(100)",
        pitfalls: [
          "A single product of two pair counts can reach about 2.5 · 10^15: multiply in 64-bit (or reduce the factors first).",
          "Remove the middle index from the suffix structures **before** using them, or pairs that start at the middle itself are counted.",
          "Different index sets count separately even when they spell the same palindrome.",
        ],
      }),
      examples: [
        { input: '"12321"', expectedOutput: "1" },
        { input: '"0000000"', expectedOutput: "21" },
        { input: '"2026202"', expectedOutput: "5" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 19);
        let s: string;
        if (kind === 0) s = pick(rng, ["0", "7"]).repeat(ri(rng, 150, 300));
        else if (kind === 1) s = randLower(rng, 150, 300, pick(rng, ["01", "123"]));
        else if (kind <= 4) s = randLower(rng, 1, 6, pick(rng, ["0", "12", "0123456789"]));
        else s = randLower(rng, 5, 30, pick(rng, ["01", "012", "0123456789", "55", "1212"]));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def countPalindromes(s: str) -> int:
              MOD = 10**9 + 7
              d = [ord(c) - 48 for c in s]
              suf_cnt = [0] * 10
              suf_pair = [0] * 100
              for b in reversed(d):
                  base = b * 10
                  for a in range(10):
                      suf_pair[base + a] += suf_cnt[a]
                  suf_cnt[b] += 1
              pre_cnt = [0] * 10
              pre_pair = [0] * 100
              ans = 0
              for c in d:
                  suf_cnt[c] -= 1
                  base = c * 10
                  for a in range(10):
                      suf_pair[base + a] -= suf_cnt[a]
                  cur = 0
                  for a in range(10):
                      for b in range(10):
                          cur += pre_pair[a * 10 + b] * suf_pair[b * 10 + a]
                  ans = (ans + cur) % MOD
                  for a in range(10):
                      pre_pair[a * 10 + c] += pre_cnt[a]
                  pre_cnt[c] += 1
              return ans
        `,
        javascript: code`
          var countPalindromes = function(s) {
              var MOD = 1000000007;
              var n = s.length;
              var sufCnt = new Array(10).fill(0), sufPair = new Array(100).fill(0);
              for (var i = n - 1; i >= 0; i--) {
                  var b = s.charCodeAt(i) - 48;
                  for (var a = 0; a < 10; a++) sufPair[b * 10 + a] += sufCnt[a];
                  sufCnt[b]++;
              }
              var preCnt = new Array(10).fill(0), prePair = new Array(100).fill(0);
              var ans = 0;
              for (var k = 0; k < n; k++) {
                  var c = s.charCodeAt(k) - 48;
                  sufCnt[c]--;
                  for (var a2 = 0; a2 < 10; a2++) sufPair[c * 10 + a2] -= sufCnt[a2];
                  for (var x = 0; x < 10; x++) {
                      for (var y = 0; y < 10; y++) {
                          var p = prePair[x * 10 + y], q = sufPair[y * 10 + x];
                          if (p && q) ans = (ans + (p % MOD) * (q % MOD) % MOD) % MOD;
                      }
                  }
                  for (var a3 = 0; a3 < 10; a3++) prePair[a3 * 10 + c] += preCnt[a3];
                  preCnt[c]++;
              }
              return ans;
          };
        `,
        typescript: code`
          function countPalindromes(s: string): number {
              var MOD = 1000000007;
              var n = s.length;
              var sufCnt: number[] = [], sufPair: number[] = [], preCnt: number[] = [], prePair: number[] = [];
              for (var z = 0; z < 100; z++) {
                  sufPair.push(0);
                  prePair.push(0);
                  if (z < 10) {
                      sufCnt.push(0);
                      preCnt.push(0);
                  }
              }
              for (var i = n - 1; i >= 0; i--) {
                  var b = s.charCodeAt(i) - 48;
                  for (var a = 0; a < 10; a++) sufPair[b * 10 + a] += sufCnt[a];
                  sufCnt[b]++;
              }
              var ans = 0;
              for (var k = 0; k < n; k++) {
                  var c = s.charCodeAt(k) - 48;
                  sufCnt[c]--;
                  for (var a2 = 0; a2 < 10; a2++) sufPair[c * 10 + a2] -= sufCnt[a2];
                  for (var x = 0; x < 10; x++) {
                      for (var y = 0; y < 10; y++) {
                          var p = prePair[x * 10 + y], q = sufPair[y * 10 + x];
                          if (p && q) ans = (ans + (p % MOD) * (q % MOD) % MOD) % MOD;
                      }
                  }
                  for (var a3 = 0; a3 < 10; a3++) prePair[a3 * 10 + c] += preCnt[a3];
                  preCnt[c]++;
              }
              return ans;
          }
        `,
        java: code`
          public static int countPalindromes(String s) {
              final long MOD = 1000000007L;
              int n = s.length();
              long[] sufCnt = new long[10], sufPair = new long[100], preCnt = new long[10], prePair = new long[100];
              for (int i = n - 1; i >= 0; i--) {
                  int b = s.charAt(i) - '0';
                  for (int a = 0; a < 10; a++) sufPair[b * 10 + a] += sufCnt[a];
                  sufCnt[b]++;
              }
              long ans = 0;
              for (int k = 0; k < n; k++) {
                  int c = s.charAt(k) - '0';
                  sufCnt[c]--;
                  for (int a = 0; a < 10; a++) sufPair[c * 10 + a] -= sufCnt[a];
                  long cur = 0;
                  for (int a = 0; a < 10; a++) {
                      for (int b = 0; b < 10; b++) cur += prePair[a * 10 + b] * sufPair[b * 10 + a];
                  }
                  ans = (ans + cur % MOD) % MOD;
                  for (int a = 0; a < 10; a++) prePair[a * 10 + c] += preCnt[a];
                  preCnt[c]++;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int countPalindromes(string s) {
              const long long MOD = 1000000007LL;
              int n = s.size();
              long long sufCnt[10] = {0}, sufPair[100] = {0}, preCnt[10] = {0}, prePair[100] = {0};
              for (int i = n - 1; i >= 0; i--) {
                  int b = s[i] - '0';
                  for (int a = 0; a < 10; a++) sufPair[b * 10 + a] += sufCnt[a];
                  sufCnt[b]++;
              }
              long long ans = 0;
              for (int k = 0; k < n; k++) {
                  int c = s[k] - '0';
                  sufCnt[c]--;
                  for (int a = 0; a < 10; a++) sufPair[c * 10 + a] -= sufCnt[a];
                  long long cur = 0;
                  for (int a = 0; a < 10; a++) {
                      for (int b = 0; b < 10; b++) cur += prePair[a * 10 + b] * sufPair[b * 10 + a];
                  }
                  ans = (ans + cur % MOD) % MOD;
                  for (int a = 0; a < 10; a++) prePair[a * 10 + c] += preCnt[a];
                  preCnt[c]++;
              }
              return (int)ans;
          }
        `,
        c: code`
          int countPalindromes(const char* s) {
              const long long MOD = 1000000007LL;
              int n = (int)strlen(s);
              long long sufCnt[10], sufPair[100], preCnt[10], prePair[100];
              memset(sufCnt, 0, sizeof(sufCnt));
              memset(sufPair, 0, sizeof(sufPair));
              memset(preCnt, 0, sizeof(preCnt));
              memset(prePair, 0, sizeof(prePair));
              for (int i = n - 1; i >= 0; i--) {
                  int b = s[i] - '0';
                  for (int a = 0; a < 10; a++) sufPair[b * 10 + a] += sufCnt[a];
                  sufCnt[b]++;
              }
              long long ans = 0;
              for (int k = 0; k < n; k++) {
                  int c = s[k] - '0';
                  sufCnt[c]--;
                  for (int a = 0; a < 10; a++) sufPair[c * 10 + a] -= sufCnt[a];
                  long long cur = 0;
                  for (int a = 0; a < 10; a++) {
                      for (int b = 0; b < 10; b++) cur += prePair[a * 10 + b] * sufPair[b * 10 + a];
                  }
                  ans = (ans + cur % MOD) % MOD;
                  for (int a = 0; a < 10; a++) prePair[a * 10 + c] += preCnt[a];
                  preCnt[c]++;
              }
              return (int)ans;
          }
        `,
        csharp: code`
          public static int CountPalindromes(string s)
          {
              const long MOD = 1000000007L;
              int n = s.Length;
              var sufCnt = new long[10];
              var sufPair = new long[100];
              var preCnt = new long[10];
              var prePair = new long[100];
              for (int i = n - 1; i >= 0; i--)
              {
                  int b = s[i] - '0';
                  for (int a = 0; a < 10; a++) sufPair[b * 10 + a] += sufCnt[a];
                  sufCnt[b]++;
              }
              long ans = 0;
              for (int k = 0; k < n; k++)
              {
                  int c = s[k] - '0';
                  sufCnt[c]--;
                  for (int a = 0; a < 10; a++) sufPair[c * 10 + a] -= sufCnt[a];
                  long cur = 0;
                  for (int a = 0; a < 10; a++)
                  {
                      for (int b = 0; b < 10; b++) cur += prePair[a * 10 + b] * sufPair[b * 10 + a];
                  }
                  ans = (ans + cur % MOD) % MOD;
                  for (int a = 0; a < 10; a++) prePair[a * 10 + c] += preCnt[a];
                  preCnt[c]++;
              }
              return (int)ans;
          }
        `,
        go: code`
          func countPalindromes(s string) int {
              const MOD = 1000000007
              n := len(s)
              sufCnt := make([]int, 10)
              sufPair := make([]int, 100)
              preCnt := make([]int, 10)
              prePair := make([]int, 100)
              for i := n - 1; i >= 0; i-- {
                  b := int(s[i] - '0')
                  for a := 0; a < 10; a++ {
                      sufPair[b*10+a] += sufCnt[a]
                  }
                  sufCnt[b]++
              }
              ans := 0
              for k := 0; k < n; k++ {
                  c := int(s[k] - '0')
                  sufCnt[c]--
                  for a := 0; a < 10; a++ {
                      sufPair[c*10+a] -= sufCnt[a]
                  }
                  cur := 0
                  for a := 0; a < 10; a++ {
                      for b := 0; b < 10; b++ {
                          cur += prePair[a*10+b] * sufPair[b*10+a]
                      }
                  }
                  ans = (ans + cur%MOD) % MOD
                  for a := 0; a < 10; a++ {
                      prePair[a*10+c] += preCnt[a]
                  }
                  preCnt[c]++
              }
              return ans
          }
        `,
        kotlin: code`
          fun countPalindromes(s: String): Int {
              val MOD = 1000000007L
              val n = s.length
              val sufCnt = LongArray(10)
              val sufPair = LongArray(100)
              val preCnt = LongArray(10)
              val prePair = LongArray(100)
              for (i in n - 1 downTo 0) {
                  val b = s[i] - '0'
                  for (a in 0 until 10) sufPair[b * 10 + a] += sufCnt[a]
                  sufCnt[b]++
              }
              var ans = 0L
              for (k in 0 until n) {
                  val c = s[k] - '0'
                  sufCnt[c]--
                  for (a in 0 until 10) sufPair[c * 10 + a] -= sufCnt[a]
                  var cur = 0L
                  for (a in 0 until 10) {
                      for (b in 0 until 10) cur += prePair[a * 10 + b] * sufPair[b * 10 + a]
                  }
                  ans = (ans + cur % MOD) % MOD
                  for (a in 0 until 10) prePair[a * 10 + c] += preCnt[a]
                  preCnt[c]++
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func countPalindromes(_ s: String) -> Int {
              let MOD = 1000000007
              let d = s.utf8.map { Int($0) - 48 }
              let n = d.count
              var sufCnt = [Int](repeating: 0, count: 10)
              var sufPair = [Int](repeating: 0, count: 100)
              var preCnt = [Int](repeating: 0, count: 10)
              var prePair = [Int](repeating: 0, count: 100)
              var i = n - 1
              while i >= 0 {
                  let b = d[i]
                  for a in 0..<10 { sufPair[b * 10 + a] += sufCnt[a] }
                  sufCnt[b] += 1
                  i -= 1
              }
              var ans = 0
              for k in 0..<n {
                  let c = d[k]
                  sufCnt[c] -= 1
                  for a in 0..<10 { sufPair[c * 10 + a] -= sufCnt[a] }
                  var cur = 0
                  for a in 0..<10 {
                      for b in 0..<10 { cur += prePair[a * 10 + b] * sufPair[b * 10 + a] }
                  }
                  ans = (ans + cur % MOD) % MOD
                  for a in 0..<10 { prePair[a * 10 + c] += preCnt[a] }
                  preCnt[c] += 1
              }
              return ans
          }
        `,
        rust: code`
          fn countPalindromes(s: String) -> i32 {
              let m: i64 = 1_000_000_007;
              let d: Vec<usize> = s.as_bytes().iter().map(|&c| (c - b'0') as usize).collect();
              let n = d.len();
              let mut suf_cnt = [0i64; 10];
              let mut suf_pair = [0i64; 100];
              let mut pre_cnt = [0i64; 10];
              let mut pre_pair = [0i64; 100];
              for i in (0..n).rev() {
                  let b = d[i];
                  for a in 0..10 {
                      suf_pair[b * 10 + a] += suf_cnt[a];
                  }
                  suf_cnt[b] += 1;
              }
              let mut ans: i64 = 0;
              for k in 0..n {
                  let c = d[k];
                  suf_cnt[c] -= 1;
                  for a in 0..10 {
                      suf_pair[c * 10 + a] -= suf_cnt[a];
                  }
                  let mut cur: i64 = 0;
                  for a in 0..10 {
                      for b in 0..10 {
                          cur += pre_pair[a * 10 + b] * suf_pair[b * 10 + a];
                      }
                  }
                  ans = (ans + cur % m) % m;
                  for a in 0..10 {
                      pre_pair[a * 10 + c] += pre_cnt[a];
                  }
                  pre_cnt[c] += 1;
              }
              ans as i32
          }
        `,
        php: code`
          function countPalindromes($s) {
              $MOD = 1000000007;
              $n = strlen($s);
              $sufCnt = array_fill(0, 10, 0);
              $sufPair = array_fill(0, 100, 0);
              $preCnt = array_fill(0, 10, 0);
              $prePair = array_fill(0, 100, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $b = ord($s[$i]) - 48;
                  for ($a = 0; $a < 10; $a++) $sufPair[$b * 10 + $a] += $sufCnt[$a];
                  $sufCnt[$b]++;
              }
              $ans = 0;
              for ($k = 0; $k < $n; $k++) {
                  $c = ord($s[$k]) - 48;
                  $sufCnt[$c]--;
                  for ($a = 0; $a < 10; $a++) $sufPair[$c * 10 + $a] -= $sufCnt[$a];
                  $cur = 0;
                  for ($a = 0; $a < 10; $a++) {
                      for ($b = 0; $b < 10; $b++) $cur += $prePair[$a * 10 + $b] * $sufPair[$b * 10 + $a];
                  }
                  $ans = ($ans + $cur % $MOD) % $MOD;
                  for ($a = 0; $a < 10; $a++) $prePair[$a * 10 + $c] += $preCnt[$a];
                  $preCnt[$c]++;
              }
              return $ans;
          }
        `,
        ruby: code`
          def countPalindromes(s)
            mod = 1_000_000_007
            d = s.bytes.map { |c| c - 48 }
            suf_cnt = Array.new(10, 0)
            suf_pair = Array.new(100, 0)
            d.reverse_each do |b|
              10.times { |a| suf_pair[b * 10 + a] += suf_cnt[a] }
              suf_cnt[b] += 1
            end
            pre_cnt = Array.new(10, 0)
            pre_pair = Array.new(100, 0)
            ans = 0
            d.each do |c|
              suf_cnt[c] -= 1
              10.times { |a| suf_pair[c * 10 + a] -= suf_cnt[a] }
              cur = 0
              10.times do |a|
                10.times { |b| cur += pre_pair[a * 10 + b] * suf_pair[b * 10 + a] }
              end
              ans = (ans + cur) % mod
              10.times { |a| pre_pair[a * 10 + c] += pre_cnt[a] }
              pre_cnt[c] += 1
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Subsequence With the Minimum Score (LC 2565) ────────────────
  (() => {
    const isSub = (t: string, s: string) => {
      let p = 0;
      for (let i = 0; i < s.length && p < t.length; i++) if (s[i] === t[p]) p++;
      return p === t.length;
    };
    const ref = (s: string, t: string): number => {
      if (isSub(t, s)) return 0;
      let best = t.length;
      for (let l = 0; l < t.length; l++) {
        for (let r = l; r < t.length && r - l + 1 < best; r++) {
          if (isSub(t.slice(0, l) + t.slice(r + 1), s)) { best = r - l + 1; break; }
        }
      }
      return best;
    };
    return {
      slug: "subsequence-with-the-minimum-score",
      title: "Subsequence With the Minimum Score",
      difficulty: "HARD" as const,
      tags: ["String", "Two Pointers", "Binary Search", "Google", "Amazon"],
      signature: {
        funcName: "minimumScore",
        params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two strings `s` and `t`. You may delete any number of characters from `t` (possibly none). Afterwards, the remaining `t` must be a **subsequence** of `s` (obtainable from `s` by deleting characters without reordering).\n\n" +
        "The **score** of a deletion is:\n\n" +
        "- `0` if nothing is deleted;\n" +
        "- otherwise `right - left + 1`, where `left` and `right` are the smallest and largest **indices in `t`** of the deleted characters.\n\n" +
        "Return the minimum possible score that makes `t` a subsequence of `s`.",
        [
          { in: 's = "kairo", t = "kxro"', out: "1", note: "Delete `x` (index 1); `kro` is a subsequence of `kairo`." },
          { in: 's = "code", t = "duel"', out: "3", note: "Neither `u` nor `l` occurs in `s`, so both must go; deleting indices 1..3 leaves `d`." },
          { in: 's = "streak", t = "sea"', out: "0", note: "`sea` is already a subsequence of `streak`." },
        ],
        ["1 <= s.length, t.length <= 10^5", "s and t consist of lowercase English letters"]),
      hints: [
        "Only `left` and `right` matter for the score, so if you delete anything you may as well delete the whole block `t[left..right]`. The task becomes: keep a prefix and a suffix of `t` and make their concatenation a subsequence of `s`.",
        "Match prefixes greedily from the left of `s` (as early as possible) and suffixes greedily from the right of `s` (as late as possible). Record, for every suffix start `k`, the latest index of `s` where matching `t[k..]` can begin.",
        "For each prefix length, the prefix ends at some position of `s`; the best suffix is the longest one whose recorded start lies after that position. Both move monotonically, so a two-pointer sweep finds the best block in linear time.",
      ],
      editorial: explain({
        idea: "Deleting a contiguous block of `t` is always optimal, so the answer is the shortest block whose removal leaves `prefix + suffix` as a subsequence of `s`. Greedy matching from both ends tells, for every prefix, how far into `s` it reaches, and for every suffix, how late in `s` it can start.",
        steps: [
          "Compute `suf[k]` for the suffixes `t[k..]`: scan `s` from the right, matching `t` from its end; `suf[k]` is the index in `s` where `t[k]` gets matched. Let `first` be the smallest `k` that can be matched this way (`suf[m] = n` for the empty suffix).",
          "If `first == 0`, `t` is already a subsequence: return 0. Otherwise start with `ans = first` (delete the prefix `t[0..first-1]`).",
          "Sweep the prefix: match `t[0], t[1], …` greedily from the left of `s`, with `q` the position just after the last matched character. Stop when a character cannot be matched.",
          "After matching `t[0..i]`, advance a pointer `k` (never below `max(first, i + 1)`) until `suf[k] >= q`; the block `t[i+1..k-1]` is deletable, so `ans = min(ans, k - i - 1)`.",
          "Return `ans`.",
        ],
        why: "If the deleted indices span `[left, right]`, deleting everything in between too keeps the remainder a subsequence and does not change the score — so blocks suffice. A prefix and a suffix can be matched disjointly exactly when the earliest end of the prefix comes before the latest start of the suffix, which is what `suf[k] >= q` tests. Earliest-left and latest-right greedy matches are optimal for these two questions, and since `q` only grows and `suf` is increasing in `k`, the pointer `k` never has to move back.",
        time: "O(|s| + |t|)",
        space: "O(|t|)",
        pitfalls: [
          "Trying every block with a fresh subsequence check is `O(|t|^2 · |s|)`.",
          "The answer `0` (nothing deleted) is different from deleting one character — check whether `t` is already a subsequence first.",
          "Do not read `suf[k]` for `k < first`: those suffixes cannot be matched at all.",
        ],
      }),
      examples: [
        { input: '"kairo"\n"kxro"', expectedOutput: "1" },
        { input: '"code"\n"duel"', expectedOutput: "3" },
        { input: '"streak"\n"sea"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, 1, 14, alpha);
        let t: string;
        if (rng() < 0.4) {
          const chars = s.split("").filter(() => rng() < 0.6);
          const k = ri(rng, 0, 3);
          for (let i = 0; i < k; i++) chars.splice(ri(rng, 0, chars.length), 0, alpha[ri(rng, 0, alpha.length - 1)]);
          t = chars.join("") || alpha[0];
        } else t = randLower(rng, 1, 10, rng() < 0.3 ? alpha + "xyz" : alpha);
        return { input: `"${s}"\n"${t}"`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: code`
          def minimumScore(s: str, t: str) -> int:
              n, m = len(s), len(t)
              suf = [n] * (m + 1)
              p = n - 1
              j = m - 1
              while j >= 0:
                  while p >= 0 and s[p] != t[j]:
                      p -= 1
                  if p < 0:
                      break
                  suf[j] = p
                  p -= 1
                  j -= 1
              first = j + 1
              if first == 0:
                  return 0
              ans = first
              q = 0
              k = first
              for i in range(m):
                  while q < n and s[q] != t[i]:
                      q += 1
                  if q == n:
                      break
                  q += 1
                  if k <= i:
                      k = i + 1
                  while k < m and suf[k] < q:
                      k += 1
                  ans = min(ans, k - i - 1)
              return ans
        `,
        javascript: code`
          var minimumScore = function(s, t) {
              var n = s.length, m = t.length;
              var suf = new Array(m + 1).fill(n);
              var p = n - 1, j = m - 1;
              while (j >= 0) {
                  while (p >= 0 && s[p] !== t[j]) p--;
                  if (p < 0) break;
                  suf[j] = p;
                  p--;
                  j--;
              }
              var first = j + 1;
              if (first === 0) return 0;
              var ans = first, q = 0, k = first;
              for (var i = 0; i < m; i++) {
                  while (q < n && s[q] !== t[i]) q++;
                  if (q === n) break;
                  q++;
                  if (k <= i) k = i + 1;
                  while (k < m && suf[k] < q) k++;
                  ans = Math.min(ans, k - i - 1);
              }
              return ans;
          };
        `,
        typescript: code`
          function minimumScore(s: string, t: string): number {
              var n = s.length, m = t.length;
              var suf: number[] = [];
              for (var z = 0; z <= m; z++) suf.push(n);
              var p = n - 1, j = m - 1;
              while (j >= 0) {
                  while (p >= 0 && s.charAt(p) !== t.charAt(j)) p--;
                  if (p < 0) break;
                  suf[j] = p;
                  p--;
                  j--;
              }
              var first = j + 1;
              if (first === 0) return 0;
              var ans = first, q = 0, k = first;
              for (var i = 0; i < m; i++) {
                  while (q < n && s.charAt(q) !== t.charAt(i)) q++;
                  if (q === n) break;
                  q++;
                  if (k <= i) k = i + 1;
                  while (k < m && suf[k] < q) k++;
                  ans = Math.min(ans, k - i - 1);
              }
              return ans;
          }
        `,
        java: code`
          public static int minimumScore(String s, String t) {
              int n = s.length(), m = t.length();
              int[] suf = new int[m + 1];
              Arrays.fill(suf, n);
              int p = n - 1, j = m - 1;
              while (j >= 0) {
                  while (p >= 0 && s.charAt(p) != t.charAt(j)) p--;
                  if (p < 0) break;
                  suf[j] = p;
                  p--;
                  j--;
              }
              int first = j + 1;
              if (first == 0) return 0;
              int ans = first, q = 0, k = first;
              for (int i = 0; i < m; i++) {
                  while (q < n && s.charAt(q) != t.charAt(i)) q++;
                  if (q == n) break;
                  q++;
                  if (k <= i) k = i + 1;
                  while (k < m && suf[k] < q) k++;
                  ans = Math.min(ans, k - i - 1);
              }
              return ans;
          }
        `,
        cpp: code`
          int minimumScore(string s, string t) {
              int n = s.size(), m = t.size();
              vector<int> suf(m + 1, n);
              int p = n - 1, j = m - 1;
              while (j >= 0) {
                  while (p >= 0 && s[p] != t[j]) p--;
                  if (p < 0) break;
                  suf[j] = p;
                  p--;
                  j--;
              }
              int first = j + 1;
              if (first == 0) return 0;
              int ans = first, q = 0, k = first;
              for (int i = 0; i < m; i++) {
                  while (q < n && s[q] != t[i]) q++;
                  if (q == n) break;
                  q++;
                  if (k <= i) k = i + 1;
                  while (k < m && suf[k] < q) k++;
                  ans = min(ans, k - i - 1);
              }
              return ans;
          }
        `,
        c: code`
          int minimumScore(const char* s, const char* t) {
              int n = (int)strlen(s), m = (int)strlen(t);
              int* suf = (int*)malloc(sizeof(int) * (m + 1));
              for (int z = 0; z <= m; z++) suf[z] = n;
              int p = n - 1, j = m - 1;
              while (j >= 0) {
                  while (p >= 0 && s[p] != t[j]) p--;
                  if (p < 0) break;
                  suf[j] = p;
                  p--;
                  j--;
              }
              int first = j + 1;
              if (first == 0) {
                  free(suf);
                  return 0;
              }
              int ans = first, q = 0, k = first;
              for (int i = 0; i < m; i++) {
                  while (q < n && s[q] != t[i]) q++;
                  if (q == n) break;
                  q++;
                  if (k <= i) k = i + 1;
                  while (k < m && suf[k] < q) k++;
                  if (k - i - 1 < ans) ans = k - i - 1;
              }
              free(suf);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumScore(string s, string t)
          {
              int n = s.Length, m = t.Length;
              var suf = new int[m + 1];
              for (int z = 0; z <= m; z++) suf[z] = n;
              int p = n - 1, j = m - 1;
              while (j >= 0)
              {
                  while (p >= 0 && s[p] != t[j]) p--;
                  if (p < 0) break;
                  suf[j] = p;
                  p--;
                  j--;
              }
              int first = j + 1;
              if (first == 0) return 0;
              int ans = first, q = 0, k = first;
              for (int i = 0; i < m; i++)
              {
                  while (q < n && s[q] != t[i]) q++;
                  if (q == n) break;
                  q++;
                  if (k <= i) k = i + 1;
                  while (k < m && suf[k] < q) k++;
                  ans = Math.Min(ans, k - i - 1);
              }
              return ans;
          }
        `,
        go: code`
          func minimumScore(s string, t string) int {
              n, m := len(s), len(t)
              suf := make([]int, m+1)
              for z := range suf {
                  suf[z] = n
              }
              p, j := n-1, m-1
              for j >= 0 {
                  for p >= 0 && s[p] != t[j] {
                      p--
                  }
                  if p < 0 {
                      break
                  }
                  suf[j] = p
                  p--
                  j--
              }
              first := j + 1
              if first == 0 {
                  return 0
              }
              ans, q, k := first, 0, first
              for i := 0; i < m; i++ {
                  for q < n && s[q] != t[i] {
                      q++
                  }
                  if q == n {
                      break
                  }
                  q++
                  if k <= i {
                      k = i + 1
                  }
                  for k < m && suf[k] < q {
                      k++
                  }
                  if k-i-1 < ans {
                      ans = k - i - 1
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun minimumScore(s: String, t: String): Int {
              val n = s.length
              val m = t.length
              val suf = IntArray(m + 1) { n }
              var p = n - 1
              var j = m - 1
              while (j >= 0) {
                  while (p >= 0 && s[p] != t[j]) p--
                  if (p < 0) break
                  suf[j] = p
                  p--
                  j--
              }
              val first = j + 1
              if (first == 0) return 0
              var ans = first
              var q = 0
              var k = first
              for (i in 0 until m) {
                  while (q < n && s[q] != t[i]) q++
                  if (q == n) break
                  q++
                  if (k <= i) k = i + 1
                  while (k < m && suf[k] < q) k++
                  ans = minOf(ans, k - i - 1)
              }
              return ans
          }
        `,
        swift: code`
          func minimumScore(_ s: String, _ t: String) -> Int {
              let a = Array(s.utf8), b = Array(t.utf8)
              let n = a.count, m = b.count
              var suf = [Int](repeating: n, count: m + 1)
              var p = n - 1, j = m - 1
              while j >= 0 {
                  while p >= 0 && a[p] != b[j] { p -= 1 }
                  if p < 0 { break }
                  suf[j] = p
                  p -= 1
                  j -= 1
              }
              let first = j + 1
              if first == 0 { return 0 }
              var ans = first, q = 0, k = first
              for i in 0..<m {
                  while q < n && a[q] != b[i] { q += 1 }
                  if q == n { break }
                  q += 1
                  if k <= i { k = i + 1 }
                  while k < m && suf[k] < q { k += 1 }
                  ans = min(ans, k - i - 1)
              }
              return ans
          }
        `,
        rust: code`
          fn minimumScore(s: String, t: String) -> i32 {
              let a = s.as_bytes();
              let b = t.as_bytes();
              let n = a.len() as i64;
              let m = b.len() as i64;
              let mut suf = vec![n; (m + 1) as usize];
              let mut p: i64 = n - 1;
              let mut j: i64 = m - 1;
              while j >= 0 {
                  while p >= 0 && a[p as usize] != b[j as usize] {
                      p -= 1;
                  }
                  if p < 0 {
                      break;
                  }
                  suf[j as usize] = p;
                  p -= 1;
                  j -= 1;
              }
              let first = j + 1;
              if first == 0 {
                  return 0;
              }
              let mut ans = first;
              let mut q: i64 = 0;
              let mut k = first;
              for i in 0..m {
                  while q < n && a[q as usize] != b[i as usize] {
                      q += 1;
                  }
                  if q == n {
                      break;
                  }
                  q += 1;
                  if k <= i {
                      k = i + 1;
                  }
                  while k < m && suf[k as usize] < q {
                      k += 1;
                  }
                  if k - i - 1 < ans {
                      ans = k - i - 1;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function minimumScore($s, $t) {
              $n = strlen($s);
              $m = strlen($t);
              $suf = array_fill(0, $m + 1, $n);
              $p = $n - 1;
              $j = $m - 1;
              while ($j >= 0) {
                  while ($p >= 0 && $s[$p] !== $t[$j]) $p--;
                  if ($p < 0) break;
                  $suf[$j] = $p;
                  $p--;
                  $j--;
              }
              $first = $j + 1;
              if ($first == 0) return 0;
              $ans = $first;
              $q = 0;
              $k = $first;
              for ($i = 0; $i < $m; $i++) {
                  while ($q < $n && $s[$q] !== $t[$i]) $q++;
                  if ($q == $n) break;
                  $q++;
                  if ($k <= $i) $k = $i + 1;
                  while ($k < $m && $suf[$k] < $q) $k++;
                  if ($k - $i - 1 < $ans) $ans = $k - $i - 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def minimumScore(s, t)
            n = s.length
            m = t.length
            suf = Array.new(m + 1, n)
            p = n - 1
            j = m - 1
            while j >= 0
              p -= 1 while p >= 0 && s[p] != t[j]
              break if p < 0
              suf[j] = p
              p -= 1
              j -= 1
            end
            first = j + 1
            return 0 if first == 0
            ans = first
            q = 0
            k = first
            (0...m).each do |i|
              q += 1 while q < n && s[q] != t[i]
              break if q == n
              q += 1
              k = i + 1 if k <= i
              k += 1 while k < m && suf[k] < q
              ans = k - i - 1 if k - i - 1 < ans
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Lexicographically Smallest Beautiful String (LC 2663) ───────
  (() => {
    // Lexicographic DFS over beautiful strings that are >= s, accepting the
    // first one that is strictly greater — independent of the
    // "bump the rightmost position" solutions.
    const ref = (s: string, k: number): string => {
      const n = s.length;
      const a: number[] = new Array(n).fill(0);
      const dfs = (pos: number, greater: boolean): boolean => {
        if (pos === n) return greater;
        const sc = s.charCodeAt(pos) - 97;
        for (let c = greater ? 0 : sc; c < k; c++) {
          if (pos >= 1 && a[pos - 1] === c) continue;
          if (pos >= 2 && a[pos - 2] === c) continue;
          a[pos] = c;
          if (dfs(pos + 1, greater || c > sc)) return true;
        }
        return false;
      };
      return dfs(0, false) ? a.map((c) => String.fromCharCode(97 + c)).join("") : "";
    };
    const beautiful = (rng: Rng, n: number, k: number, greedyMaxFrom: number): string => {
      const a: number[] = [];
      for (let i = 0; i < n; i++) {
        const ok: number[] = [];
        for (let c = 0; c < k; c++) if (!(i >= 1 && a[i - 1] === c) && !(i >= 2 && a[i - 2] === c)) ok.push(c);
        a.push(i >= greedyMaxFrom ? ok[ok.length - 1] : pick(rng, ok));
      }
      return a.map((c) => String.fromCharCode(97 + c)).join("");
    };
    return {
      slug: "lexicographically-smallest-beautiful-string",
      title: "Lexicographically Smallest Beautiful String",
      difficulty: "HARD" as const,
      tags: ["String", "Greedy", "Google", "Amazon"],
      signature: {
        funcName: "smallestBeautifulString",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "A string is **beautiful** when:\n\n" +
        "- it uses only the first `k` lowercase letters of the alphabet, and\n" +
        "- it contains **no palindromic substring of length 2 or more**.\n\n" +
        "You are given a beautiful string `s` of length `n` and the integer `k`. Return the **lexicographically smallest** beautiful string of length `n` that is strictly **larger** than `s`, or an empty string if there is none.",
        [
          { in: 's = "kaib", k = 12', out: '"kaic"', note: "Raising the last letter to `c` keeps every window palindrome-free." },
          { in: 's = "dcb", k = 4', out: '""', note: "With only `a`–`d`, no position can be raised without creating a palindrome." },
          { in: 's = "abcd", k = 4', out: '"abda"', note: "The last letter is already `d`; raise the third to `d` and fill the rest with the smallest safe letter." },
        ],
        ["1 <= n == s.length <= 10^5", "4 <= k <= 26", "s is a beautiful string"]),
      hints: [
        "A string has no palindromic substring of length >= 2 exactly when no character equals either of the two characters before it.",
        "To get the next string, keep the longest possible prefix of `s`: try to raise the **last** position first, then the one before it, and so on.",
        "At position `i`, try letters above `s[i]` (below `k`) that differ from the two previous letters. Once one works, fill every later position with the smallest letter that differs from its two predecessors — with `k >= 4` one of `a`, `b`, `c` always works.",
      ],
      editorial: explain({
        idea: "Beauty is a local rule (each letter differs from the previous two), so the next beautiful string keeps the longest prefix of `s` it can, bumps one position minimally, and fills the tail greedily with the smallest legal letters.",
        steps: [
          "Convert `s` to letter indices `a[0..n-1]`.",
          "For `i` from `n - 1` down to 0: look for the smallest `c` with `a[i] < c < k`, `c != a[i-1]` and `c != a[i-2]` (where those exist).",
          "If found, set `a[i] = c`, then for each `j > i` set `a[j]` to the smallest letter different from `a[j-1]` and `a[j-2]`, and return the result.",
          "If no position can be raised, return the empty string.",
        ],
        why: "A palindrome of length >= 2 contains a palindrome of length 2 or 3 at its centre, so forbidding `x[j] == x[j-1]` and `x[j] == x[j-2]` is equivalent to beauty. The answer must share the longest possible prefix with `s` and then have a larger letter at the first difference, and that letter should be as small as possible; after it, any suffix is allowed, so the smallest choice letter by letter is optimal — and it always exists because at most two letters are forbidden while `k >= 4`.",
        time: "O(n · k)",
        space: "O(n)",
        pitfalls: [
          "Checking only adjacent letters misses length-3 palindromes like `aba`.",
          "The new letter must stay below `k`, not below `z`.",
          "When filling the tail, check against the **new** letters already placed, not the original `s`.",
        ],
      }),
      examples: [
        { input: '"kaib"\n12', expectedOutput: "kaic" },
        { input: '"dcb"\n4', expectedOutput: "" },
        { input: '"abcd"\n4', expectedOutput: "abda" },
      ],
      gen: (rng: Rng) => {
        const k = rng() < 0.7 ? ri(rng, 4, 6) : ri(rng, 4, 26);
        const n = ri(rng, 1, pick(rng, [3, 8, 14]));
        const mode = ri(rng, 0, 4);
        const from = mode === 0 ? 0 : mode <= 2 ? ri(rng, 0, n) : n;
        const s = beautiful(rng, n, k, from);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: code`
          def smallestBeautifulString(s: str, k: int) -> str:
              a = [ord(c) - 97 for c in s]
              n = len(a)
              for i in range(n - 1, -1, -1):
                  c = a[i] + 1
                  while c < k and ((i >= 1 and a[i - 1] == c) or (i >= 2 and a[i - 2] == c)):
                      c += 1
                  if c < k:
                      a[i] = c
                      for j in range(i + 1, n):
                          x = 0
                          while (j >= 1 and a[j - 1] == x) or (j >= 2 and a[j - 2] == x):
                              x += 1
                          a[j] = x
                      return "".join(chr(97 + x) for x in a)
              return ""
        `,
        javascript: code`
          var smallestBeautifulString = function(s, k) {
              var n = s.length;
              var a = [];
              for (var q = 0; q < n; q++) a.push(s.charCodeAt(q) - 97);
              for (var i = n - 1; i >= 0; i--) {
                  var c = a[i] + 1;
                  while (c < k && ((i >= 1 && a[i - 1] === c) || (i >= 2 && a[i - 2] === c))) c++;
                  if (c < k) {
                      a[i] = c;
                      for (var j = i + 1; j < n; j++) {
                          var x = 0;
                          while ((j >= 1 && a[j - 1] === x) || (j >= 2 && a[j - 2] === x)) x++;
                          a[j] = x;
                      }
                      var res = "";
                      for (var p = 0; p < n; p++) res += String.fromCharCode(97 + a[p]);
                      return res;
                  }
              }
              return "";
          };
        `,
        typescript: code`
          function smallestBeautifulString(s: string, k: number): string {
              var n = s.length;
              var a: number[] = [];
              for (var q = 0; q < n; q++) a.push(s.charCodeAt(q) - 97);
              for (var i = n - 1; i >= 0; i--) {
                  var c = a[i] + 1;
                  while (c < k && ((i >= 1 && a[i - 1] === c) || (i >= 2 && a[i - 2] === c))) c++;
                  if (c < k) {
                      a[i] = c;
                      for (var j = i + 1; j < n; j++) {
                          var x = 0;
                          while ((j >= 1 && a[j - 1] === x) || (j >= 2 && a[j - 2] === x)) x++;
                          a[j] = x;
                      }
                      var res = "";
                      for (var p = 0; p < n; p++) res += String.fromCharCode(97 + a[p]);
                      return res;
                  }
              }
              return "";
          }
        `,
        java: code`
          public static String smallestBeautifulString(String s, int k) {
              int n = s.length();
              char[] a = s.toCharArray();
              for (int i = n - 1; i >= 0; i--) {
                  int c = a[i] - 'a' + 1;
                  while (c < k && ((i >= 1 && a[i - 1] - 'a' == c) || (i >= 2 && a[i - 2] - 'a' == c))) c++;
                  if (c < k) {
                      a[i] = (char) ('a' + c);
                      for (int j = i + 1; j < n; j++) {
                          int x = 0;
                          while ((j >= 1 && a[j - 1] - 'a' == x) || (j >= 2 && a[j - 2] - 'a' == x)) x++;
                          a[j] = (char) ('a' + x);
                      }
                      return new String(a);
                  }
              }
              return "";
          }
        `,
        cpp: code`
          string smallestBeautifulString(string s, int k) {
              int n = s.size();
              for (int i = n - 1; i >= 0; i--) {
                  int c = s[i] - 'a' + 1;
                  while (c < k && ((i >= 1 && s[i - 1] - 'a' == c) || (i >= 2 && s[i - 2] - 'a' == c))) c++;
                  if (c < k) {
                      s[i] = (char)('a' + c);
                      for (int j = i + 1; j < n; j++) {
                          int x = 0;
                          while ((j >= 1 && s[j - 1] - 'a' == x) || (j >= 2 && s[j - 2] - 'a' == x)) x++;
                          s[j] = (char)('a' + x);
                      }
                      return s;
                  }
              }
              return "";
          }
        `,
        c: code`
          char* smallestBeautifulString(const char* s, int k) {
              int n = (int)strlen(s);
              char* a = (char*)malloc(n + 1);
              memcpy(a, s, n + 1);
              for (int i = n - 1; i >= 0; i--) {
                  int c = a[i] - 'a' + 1;
                  while (c < k && ((i >= 1 && a[i - 1] - 'a' == c) || (i >= 2 && a[i - 2] - 'a' == c))) c++;
                  if (c < k) {
                      a[i] = (char)('a' + c);
                      for (int j = i + 1; j < n; j++) {
                          int x = 0;
                          while ((j >= 1 && a[j - 1] - 'a' == x) || (j >= 2 && a[j - 2] - 'a' == x)) x++;
                          a[j] = (char)('a' + x);
                      }
                      return a;
                  }
              }
              a[0] = '\0';
              return a;
          }
        `,
        csharp: code`
          public static string SmallestBeautifulString(string s, int k)
          {
              int n = s.Length;
              char[] a = s.ToCharArray();
              for (int i = n - 1; i >= 0; i--)
              {
                  int c = a[i] - 'a' + 1;
                  while (c < k && ((i >= 1 && a[i - 1] - 'a' == c) || (i >= 2 && a[i - 2] - 'a' == c))) c++;
                  if (c < k)
                  {
                      a[i] = (char)('a' + c);
                      for (int j = i + 1; j < n; j++)
                      {
                          int x = 0;
                          while ((j >= 1 && a[j - 1] - 'a' == x) || (j >= 2 && a[j - 2] - 'a' == x)) x++;
                          a[j] = (char)('a' + x);
                      }
                      return new string(a);
                  }
              }
              return "";
          }
        `,
        go: code`
          func smallestBeautifulString(s string, k int) string {
              n := len(s)
              a := []byte(s)
              for i := n - 1; i >= 0; i-- {
                  c := int(a[i]-'a') + 1
                  for c < k && ((i >= 1 && int(a[i-1]-'a') == c) || (i >= 2 && int(a[i-2]-'a') == c)) {
                      c++
                  }
                  if c < k {
                      a[i] = byte('a' + c)
                      for j := i + 1; j < n; j++ {
                          x := 0
                          for (j >= 1 && int(a[j-1]-'a') == x) || (j >= 2 && int(a[j-2]-'a') == x) {
                              x++
                          }
                          a[j] = byte('a' + x)
                      }
                      return string(a)
                  }
              }
              return ""
          }
        `,
        kotlin: code`
          fun smallestBeautifulString(s: String, k: Int): String {
              val n = s.length
              val a = s.toCharArray()
              for (i in n - 1 downTo 0) {
                  var c = (a[i] - 'a') + 1
                  while (c < k && ((i >= 1 && a[i - 1] - 'a' == c) || (i >= 2 && a[i - 2] - 'a' == c))) c++
                  if (c < k) {
                      a[i] = 'a' + c
                      for (j in i + 1 until n) {
                          var x = 0
                          while ((j >= 1 && a[j - 1] - 'a' == x) || (j >= 2 && a[j - 2] - 'a' == x)) x++
                          a[j] = 'a' + x
                      }
                      return String(a)
                  }
              }
              return ""
          }
        `,
        swift: code`
          func smallestBeautifulString(_ s: String, _ k: Int) -> String {
              var a = s.utf8.map { Int($0) - 97 }
              let n = a.count
              var i = n - 1
              while i >= 0 {
                  var c = a[i] + 1
                  while c < k && ((i >= 1 && a[i - 1] == c) || (i >= 2 && a[i - 2] == c)) { c += 1 }
                  if c < k {
                      a[i] = c
                      var j = i + 1
                      while j < n {
                          var x = 0
                          while (j >= 1 && a[j - 1] == x) || (j >= 2 && a[j - 2] == x) { x += 1 }
                          a[j] = x
                          j += 1
                      }
                      return String(decoding: a.map { UInt8($0 + 97) }, as: UTF8.self)
                  }
                  i -= 1
              }
              return ""
          }
        `,
        rust: code`
          fn smallestBeautifulString(s: String, k: i32) -> String {
              let mut a: Vec<i32> = s.as_bytes().iter().map(|&c| (c - b'a') as i32).collect();
              let n = a.len();
              for i in (0..n).rev() {
                  let mut c = a[i] + 1;
                  while c < k && ((i >= 1 && a[i - 1] == c) || (i >= 2 && a[i - 2] == c)) {
                      c += 1;
                  }
                  if c < k {
                      a[i] = c;
                      for j in i + 1..n {
                          let mut x = 0;
                          while (j >= 1 && a[j - 1] == x) || (j >= 2 && a[j - 2] == x) {
                              x += 1;
                          }
                          a[j] = x;
                      }
                      return a.iter().map(|&x| (b'a' + x as u8) as char).collect();
                  }
              }
              String::new()
          }
        `,
        php: code`
          function smallestBeautifulString($s, $k) {
              $n = strlen($s);
              $a = [];
              for ($q = 0; $q < $n; $q++) $a[] = ord($s[$q]) - 97;
              for ($i = $n - 1; $i >= 0; $i--) {
                  $c = $a[$i] + 1;
                  while ($c < $k && (($i >= 1 && $a[$i - 1] == $c) || ($i >= 2 && $a[$i - 2] == $c))) $c++;
                  if ($c < $k) {
                      $a[$i] = $c;
                      for ($j = $i + 1; $j < $n; $j++) {
                          $x = 0;
                          while (($j >= 1 && $a[$j - 1] == $x) || ($j >= 2 && $a[$j - 2] == $x)) $x++;
                          $a[$j] = $x;
                      }
                      $res = "";
                      for ($p = 0; $p < $n; $p++) $res .= chr(97 + $a[$p]);
                      return $res;
                  }
              }
              return "";
          }
        `,
        ruby: code`
          def smallestBeautifulString(s, k)
            a = s.bytes.map { |c| c - 97 }
            n = a.length
            (n - 1).downto(0) do |i|
              c = a[i] + 1
              c += 1 while c < k && ((i >= 1 && a[i - 1] == c) || (i >= 2 && a[i - 2] == c))
              next unless c < k
              a[i] = c
              (i + 1...n).each do |j|
                x = 0
                x += 1 while (j >= 1 && a[j - 1] == x) || (j >= 2 && a[j - 2] == x)
                a[j] = x
              end
              return a.map { |x| (97 + x).chr }.join
            end
            ""
          end
        `,
      },
    };
  })(),

  // ── Length of the Longest Valid Substring (LC 2781) ─────────────
  (() => {
    const ref = (word: string, forbidden: string[]): number => {
      let best = 0;
      for (let i = 0; i < word.length; i++) {
        for (let j = i + 1; j <= word.length; j++) {
          const sub = word.slice(i, j);
          if (forbidden.some((f) => sub.includes(f))) break;
          best = Math.max(best, j - i);
        }
      }
      return best;
    };
    return {
      slug: "length-of-the-longest-valid-substring",
      title: "Length of the Longest Valid Substring",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "String", "Sliding Window", "Amazon", "Google"],
      signature: {
        funcName: "longestValidSubstring",
        params: [{ name: "word", type: "string" as const }, { name: "forbidden", type: "string[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A chat filter on CodeKairo blocks a list of `forbidden` strings. A string is **valid** if **none** of its substrings is in `forbidden`.\n\n" +
        "Given `word` and `forbidden`, return the length of the longest valid substring of `word`. The empty substring is valid, so the answer may be 0.",
        [
          { in: 'word = "kairokai", forbidden = ["ok","ai"]', out: "3", note: "`iro` avoids both; any longer window contains `ai` or `ok`." },
          { in: 'word = "codekairo", forbidden = ["z"]', out: "9" },
          { in: 'word = "aaaa", forbidden = ["a"]', out: "0" },
        ],
        [
          "1 <= word.length <= 10^5",
          "word consists only of lowercase English letters",
          "1 <= forbidden.length <= 10^5",
          "1 <= forbidden[i].length <= 10",
          "forbidden[i] consists only of lowercase English letters",
        ]),
      hints: [
        "Validity is monotone: if a window is valid, every window inside it is valid. Think sliding window — for each right end, find the smallest valid left end.",
        "When the right end moves to `r`, the only new substrings are those ending at `r`, and a forbidden word has length at most 10, so only 10 of them can matter.",
        "Put `forbidden` in a hash set. For `i` from `r` down to `max(left, r - 9)`, if `word[i..r]` is forbidden, move `left` to `i + 1` and stop. The window `[left, r]` is then the longest valid one ending at `r`.",
      ],
      editorial: explain({
        idea: "Sweep the right end of a window. A newly appearing forbidden substring must end at the new right end and is at most 10 long, so each step needs at most 10 hash-set lookups to push the left end past every forbidden occurrence.",
        steps: [
          "Insert all forbidden strings into a hash set; set `left = 0`, `best = 0`.",
          "For each `r` from 0 to `n - 1`: for `i` from `r` down to `max(left, r - 9)`, if `word[i..r]` is in the set, set `left = i + 1` and break.",
          "Update `best = max(best, r - left + 1)`.",
          "Return `best`.",
        ],
        why: "Invariant: `[left, r]` is the longest valid window ending at `r`. Moving to `r + 1` can only introduce forbidden substrings that end at `r + 1`; scanning start positions from right to left finds the one with the largest start first, and the window must begin after it. Starts before `left` need not be checked because `left` already excludes an earlier forbidden occurrence. Valid windows are closed under shrinking, so the best window for each right end is the one starting at `left`.",
        time: "O(n · 10 · 10) — at most 10 lookups of strings of length at most 10 per position",
        space: "O(total length of forbidden)",
        pitfalls: [
          "Scanning `i` from left to right stops at the wrong forbidden substring and leaves the window invalid.",
          "Starting the scan below `left` is wasted work; starting below `r - 9` is pointless because forbidden words are at most 10 long.",
          "Checking every substring of `word` against every forbidden word is far too slow.",
        ],
      }),
      examples: [
        { input: '"kairokai"\n["ok","ai"]', expectedOutput: "3" },
        { input: '"codekairo"\n["z"]', expectedOutput: "9" },
        { input: '"aaaa"\n["a"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abc", "abcdefgh"]);
        const word = randLower(rng, 1, pick(rng, [5, 12, 22]), alpha);
        const m = ri(rng, 1, 5);
        const forbidden: string[] = [];
        for (let i = 0; i < m; i++) {
          if (rng() < 0.6) {
            const len = ri(rng, 1, Math.min(4, word.length));
            const at = ri(rng, 0, word.length - len);
            forbidden.push(word.slice(at, at + len));
          } else forbidden.push(randLower(rng, 1, 4, alpha));
        }
        return { input: `"${word}"\n${fmtStrArr(forbidden)}`, expectedOutput: String(ref(word, forbidden)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestValidSubstring(word: str, forbidden: List[str]) -> int:
              bad = set(forbidden)
              left = 0
              best = 0
              for r in range(len(word)):
                  for i in range(r, max(left, r - 9) - 1, -1):
                      if word[i:r + 1] in bad:
                          left = i + 1
                          break
                  best = max(best, r - left + 1)
              return best
        `,
        javascript: code`
          var longestValidSubstring = function(word, forbidden) {
              var bad = new Set(forbidden);
              var left = 0, best = 0;
              for (var r = 0; r < word.length; r++) {
                  for (var i = r; i >= Math.max(left, r - 9); i--) {
                      if (bad.has(word.substring(i, r + 1))) {
                          left = i + 1;
                          break;
                      }
                  }
                  best = Math.max(best, r - left + 1);
              }
              return best;
          };
        `,
        typescript: code`
          function longestValidSubstring(word: string, forbidden: string[]): number {
              var bad: { [k: string]: boolean } = {};
              for (var f = 0; f < forbidden.length; f++) bad["#" + forbidden[f]] = true;
              var left = 0, best = 0;
              for (var r = 0; r < word.length; r++) {
                  for (var i = r; i >= Math.max(left, r - 9); i--) {
                      if (bad.hasOwnProperty("#" + word.substring(i, r + 1))) {
                          left = i + 1;
                          break;
                      }
                  }
                  best = Math.max(best, r - left + 1);
              }
              return best;
          }
        `,
        java: code`
          public static int longestValidSubstring(String word, String[] forbidden) {
              Set<String> bad = new HashSet<>(Arrays.asList(forbidden));
              int left = 0, best = 0;
              for (int r = 0; r < word.length(); r++) {
                  for (int i = r; i >= Math.max(left, r - 9); i--) {
                      if (bad.contains(word.substring(i, r + 1))) {
                          left = i + 1;
                          break;
                      }
                  }
                  best = Math.max(best, r - left + 1);
              }
              return best;
          }
        `,
        cpp: code`
          int longestValidSubstring(string word, vector<string>& forbidden) {
              unordered_set<string> bad(forbidden.begin(), forbidden.end());
              int left = 0, best = 0, n = word.size();
              for (int r = 0; r < n; r++) {
                  for (int i = r; i >= max(left, r - 9); i--) {
                      if (bad.count(word.substr(i, r - i + 1))) {
                          left = i + 1;
                          break;
                      }
                  }
                  best = max(best, r - left + 1);
              }
              return best;
          }
        `,
        c: code`
          static int lvsCmp(const void* x, const void* y) {
              long long a = *(const long long*)x, b = *(const long long*)y;
              return (a > b) - (a < b);
          }

          int longestValidSubstring(const char* word, char** forbidden, int forbiddenSize) {
              long long* keys = (long long*)malloc(sizeof(long long) * (forbiddenSize > 0 ? forbiddenSize : 1));
              for (int f = 0; f < forbiddenSize; f++) {
                  long long key = 0;
                  for (const char* p = forbidden[f]; *p; p++) key = key * 27 + (*p - 'a' + 1);
                  keys[f] = key;
              }
              qsort(keys, forbiddenSize, sizeof(long long), lvsCmp);
              int n = (int)strlen(word), left = 0, best = 0;
              for (int r = 0; r < n; r++) {
                  long long key = 0, pw = 1;
                  int lo = left > r - 9 ? left : r - 9;
                  for (int i = r; i >= lo; i--) {
                      key += (long long)(word[i] - 'a' + 1) * pw;
                      pw *= 27;
                      if (bsearch(&key, keys, forbiddenSize, sizeof(long long), lvsCmp) != NULL) {
                          left = i + 1;
                          break;
                      }
                  }
                  if (r - left + 1 > best) best = r - left + 1;
              }
              free(keys);
              return best;
          }
        `,
        csharp: code`
          public static int LongestValidSubstring(string word, string[] forbidden)
          {
              var bad = new HashSet<string>(forbidden);
              int left = 0, best = 0;
              for (int r = 0; r < word.Length; r++)
              {
                  for (int i = r; i >= Math.Max(left, r - 9); i--)
                  {
                      if (bad.Contains(word.Substring(i, r - i + 1)))
                      {
                          left = i + 1;
                          break;
                      }
                  }
                  best = Math.Max(best, r - left + 1);
              }
              return best;
          }
        `,
        go: code`
          func longestValidSubstring(word string, forbidden []string) int {
              bad := map[string]bool{}
              for _, f := range forbidden {
                  bad[f] = true
              }
              left, best := 0, 0
              for r := 0; r < len(word); r++ {
                  lo := r - 9
                  if left > lo {
                      lo = left
                  }
                  for i := r; i >= lo; i-- {
                      if bad[word[i:r+1]] {
                          left = i + 1
                          break
                      }
                  }
                  if r-left+1 > best {
                      best = r - left + 1
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestValidSubstring(word: String, forbidden: Array<String>): Int {
              val bad = HashSet<String>()
              for (f in forbidden) bad.add(f)
              var left = 0
              var best = 0
              for (r in 0 until word.length) {
                  var i = r
                  val lo = maxOf(left, r - 9)
                  while (i >= lo) {
                      if (bad.contains(word.substring(i, r + 1))) {
                          left = i + 1
                          break
                      }
                      i--
                  }
                  best = maxOf(best, r - left + 1)
              }
              return best
          }
        `,
        swift: code`
          func longestValidSubstring(_ word: String, _ forbidden: [String]) -> Int {
              let bad = Set(forbidden.map { Array($0.utf8) })
              let w = Array(word.utf8)
              var left = 0, best = 0
              for r in 0..<w.count {
                  var i = r
                  let lo = max(left, r - 9)
                  while i >= lo {
                      if bad.contains(Array(w[i...r])) {
                          left = i + 1
                          break
                      }
                      i -= 1
                  }
                  best = max(best, r - left + 1)
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn longestValidSubstring(word: String, forbidden: Vec<String>) -> i32 {
              let bad: HashSet<&str> = forbidden.iter().map(|f| f.as_str()).collect();
              let n = word.len() as i64;
              let mut left: i64 = 0;
              let mut best: i64 = 0;
              for r in 0..n {
                  let lo = std::cmp::max(left, r - 9);
                  let mut i = r;
                  while i >= lo {
                      if bad.contains(&word[i as usize..(r + 1) as usize]) {
                          left = i + 1;
                          break;
                      }
                      i -= 1;
                  }
                  if r - left + 1 > best {
                      best = r - left + 1;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function longestValidSubstring($word, $forbidden) {
              $bad = [];
              foreach ($forbidden as $f) $bad["#" . $f] = true;
              $n = strlen($word);
              $left = 0;
              $best = 0;
              for ($r = 0; $r < $n; $r++) {
                  $lo = max($left, $r - 9);
                  for ($i = $r; $i >= $lo; $i--) {
                      if (isset($bad["#" . substr($word, $i, $r - $i + 1)])) {
                          $left = $i + 1;
                          break;
                      }
                  }
                  $best = max($best, $r - $left + 1);
              }
              return $best;
          }
        `,
        ruby: code`
          def longestValidSubstring(word, forbidden)
            bad = {}
            forbidden.each { |f| bad[f] = true }
            left = 0
            best = 0
            (0...word.length).each do |r|
              lo = [left, r - 9].max
              i = r
              while i >= lo
                if bad.key?(word[i..r])
                  left = i + 1
                  break
                end
                i -= 1
              end
              best = [best, r - left + 1].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count Complete Substrings (LC 2953) ─────────────────────────
  (() => {
    const ref = (word: string, k: number): number => {
      let total = 0;
      for (let i = 0; i < word.length; i++) {
        const cnt = new Array(26).fill(0);
        for (let j = i; j < word.length; j++) {
          if (j > i && Math.abs(word.charCodeAt(j) - word.charCodeAt(j - 1)) > 2) break;
          cnt[word.charCodeAt(j) - 97]++;
          if (cnt.every((c) => c === 0 || c === k)) total++;
        }
      }
      return total;
    };
    return {
      slug: "count-complete-substrings",
      title: "Count Complete Substrings",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Amazon", "Google"],
      signature: {
        funcName: "countCompleteSubstrings",
        params: [{ name: "word", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A substring of `word` is **complete** when:\n\n" +
        "- every character that appears in it appears **exactly `k` times**, and\n" +
        "- any two **adjacent** characters in it are at most 2 apart in the alphabet (`|c1 - c2| <= 2`, so `a` may sit next to `a`, `b` or `c`, but not `d`).\n\n" +
        "Return the number of complete substrings of `word`. Substrings at different positions are counted separately.",
        [
          { in: 'word = "aabbcc", k = 2', out: "6", note: "`aa`, `bb`, `cc`, `aabb`, `bbcc` and `aabbcc`." },
          { in: 'word = "abcabc", k = 1', out: "15", note: "Every substring of length 1, 2 or 3 has distinct letters with neighbours at most 2 apart." },
          { in: 'word = "zza", k = 2', out: "1", note: "`z` and `a` are too far apart to be neighbours, so only `zz` counts." },
        ],
        ["1 <= word.length <= 10^5", "word consists only of lowercase English letters", "1 <= k <= word.length"]),
      hints: [
        "A pair of neighbours more than 2 apart can never be inside a complete substring — cut `word` into maximal segments at those places and solve each segment alone.",
        "A complete substring with `u` distinct letters has length exactly `u · k`, and `u` is at most 26.",
        "For each `u` from 1 to 26, slide a window of length `u · k` over the segment and keep the number of letters whose count in the window is exactly `k`; the window is complete when that number equals `u`.",
      ],
      editorial: explain({
        idea: "Split at the illegal neighbour pairs, then fix the number of distinct letters `u`: the window length is forced to `u · k`, so a fixed-size sliding window with letter counts checks every candidate in `O(1)` amortised time.",
        steps: [
          "Walk `word` and cut it wherever `|word[i] - word[i-1]| > 2`; every complete substring lies inside one segment.",
          "For a segment and each `u = 1..26` with `u · k <=` segment length: slide a window of size `w = u · k`.",
          "Maintain `cnt[c]` and `exact`, the number of letters with `cnt[c] == k`. When a letter's count moves to `k`, increment `exact`; when it moves away from `k`, decrement it.",
          "Whenever the window is full and `exact == u`, count it.",
          "Sum over all segments and all `u`.",
        ],
        why: "If `u` letters each occur exactly `k` times in a window of length `u · k`, they fill the whole window, so no other letter is present and the window is complete; conversely a complete window with `u` distinct letters has exactly this shape. Each complete substring has exactly one `u`, so it is counted once, and the neighbour condition holds because it lies inside a segment.",
        time: "O(26 · n)",
        space: "O(26)",
        pitfalls: [
          "Forgetting the neighbour rule, or applying it only at window boundaries instead of splitting the string.",
          "Testing every window length is `O(n^2)`; only the 26 multiples of `k` can work.",
          "When a count rises from `k` to `k + 1`, the letter stops being exact — decrement `exact`, do not leave it.",
        ],
      }),
      examples: [
        { input: '"aabbcc"\n2', expectedOutput: "6" },
        { input: '"abcabc"\n1', expectedOutput: "15" },
        { input: '"zza"\n2', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "aceg", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        let word: string;
        if (rng() < 0.3) {
          const unit = randLower(rng, 1, 3, alpha);
          word = "";
          while (word.length < 6) word += unit.split("").map((c) => c.repeat(ri(rng, 1, 3))).join("");
          word = word.slice(0, ri(rng, 1, 24));
        } else word = randLower(rng, 1, pick(rng, [6, 16, 28]), alpha);
        const k = Math.min(word.length, pick(rng, [1, 1, 2, 2, 3, ri(rng, 1, 4)]));
        return { input: `"${word}"\n${k}`, expectedOutput: String(ref(word, k)) };
      },
      solutions: {
        python: code`
          def countCompleteSubstrings(word: str, k: int) -> int:
              n = len(word)
              total = 0
              start = 0
              for end in range(1, n + 1):
                  if end == n or abs(ord(word[end]) - ord(word[end - 1])) > 2:
                      total += _complete_in_segment(word, start, end, k)
                      start = end
              return total

          def _complete_in_segment(word, lo, hi, k):
              res = 0
              for u in range(1, 27):
                  w = u * k
                  if w > hi - lo:
                      break
                  cnt = [0] * 26
                  exact = 0
                  for i in range(lo, hi):
                      c = ord(word[i]) - 97
                      cnt[c] += 1
                      if cnt[c] == k:
                          exact += 1
                      elif cnt[c] == k + 1:
                          exact -= 1
                      if i - lo >= w:
                          d = ord(word[i - w]) - 97
                          if cnt[d] == k:
                              exact -= 1
                          cnt[d] -= 1
                          if cnt[d] == k:
                              exact += 1
                      if i - lo >= w - 1 and exact == u:
                          res += 1
              return res
        `,
        javascript: code`
          function ccsSegment(word, lo, hi, k) {
              var res = 0;
              for (var u = 1; u <= 26 && u * k <= hi - lo; u++) {
                  var w = u * k;
                  var cnt = new Array(26).fill(0);
                  var exact = 0;
                  for (var i = lo; i < hi; i++) {
                      var c = word.charCodeAt(i) - 97;
                      cnt[c]++;
                      if (cnt[c] === k) exact++;
                      else if (cnt[c] === k + 1) exact--;
                      if (i - lo >= w) {
                          var d = word.charCodeAt(i - w) - 97;
                          if (cnt[d] === k) exact--;
                          cnt[d]--;
                          if (cnt[d] === k) exact++;
                      }
                      if (i - lo >= w - 1 && exact === u) res++;
                  }
              }
              return res;
          }

          var countCompleteSubstrings = function(word, k) {
              var n = word.length, total = 0, start = 0;
              for (var end = 1; end <= n; end++) {
                  if (end === n || Math.abs(word.charCodeAt(end) - word.charCodeAt(end - 1)) > 2) {
                      total += ccsSegment(word, start, end, k);
                      start = end;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function ccsSegment(word: string, lo: number, hi: number, k: number): number {
              var res = 0;
              for (var u = 1; u <= 26 && u * k <= hi - lo; u++) {
                  var w = u * k;
                  var cnt: number[] = [];
                  for (var z = 0; z < 26; z++) cnt.push(0);
                  var exact = 0;
                  for (var i = lo; i < hi; i++) {
                      var c = word.charCodeAt(i) - 97;
                      cnt[c]++;
                      if (cnt[c] === k) exact++;
                      else if (cnt[c] === k + 1) exact--;
                      if (i - lo >= w) {
                          var d = word.charCodeAt(i - w) - 97;
                          if (cnt[d] === k) exact--;
                          cnt[d]--;
                          if (cnt[d] === k) exact++;
                      }
                      if (i - lo >= w - 1 && exact === u) res++;
                  }
              }
              return res;
          }

          function countCompleteSubstrings(word: string, k: number): number {
              var n = word.length, total = 0, start = 0;
              for (var end = 1; end <= n; end++) {
                  if (end === n || Math.abs(word.charCodeAt(end) - word.charCodeAt(end - 1)) > 2) {
                      total += ccsSegment(word, start, end, k);
                      start = end;
                  }
              }
              return total;
          }
        `,
        java: code`
          static int ccsSegment(String word, int lo, int hi, int k) {
              int res = 0;
              for (int u = 1; u <= 26 && (long) u * k <= hi - lo; u++) {
                  int w = u * k;
                  int[] cnt = new int[26];
                  int exact = 0;
                  for (int i = lo; i < hi; i++) {
                      int c = word.charAt(i) - 'a';
                      cnt[c]++;
                      if (cnt[c] == k) exact++;
                      else if (cnt[c] == k + 1) exact--;
                      if (i - lo >= w) {
                          int d = word.charAt(i - w) - 'a';
                          if (cnt[d] == k) exact--;
                          cnt[d]--;
                          if (cnt[d] == k) exact++;
                      }
                      if (i - lo >= w - 1 && exact == u) res++;
                  }
              }
              return res;
          }

          public static int countCompleteSubstrings(String word, int k) {
              int n = word.length(), total = 0, start = 0;
              for (int end = 1; end <= n; end++) {
                  if (end == n || Math.abs(word.charAt(end) - word.charAt(end - 1)) > 2) {
                      total += ccsSegment(word, start, end, k);
                      start = end;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          static int ccsSegment(const string& word, int lo, int hi, int k) {
              int res = 0;
              for (int u = 1; u <= 26 && (long long)u * k <= hi - lo; u++) {
                  int w = u * k;
                  int cnt[26] = {0};
                  int exact = 0;
                  for (int i = lo; i < hi; i++) {
                      int c = word[i] - 'a';
                      cnt[c]++;
                      if (cnt[c] == k) exact++;
                      else if (cnt[c] == k + 1) exact--;
                      if (i - lo >= w) {
                          int d = word[i - w] - 'a';
                          if (cnt[d] == k) exact--;
                          cnt[d]--;
                          if (cnt[d] == k) exact++;
                      }
                      if (i - lo >= w - 1 && exact == u) res++;
                  }
              }
              return res;
          }

          int countCompleteSubstrings(string word, int k) {
              int n = word.size(), total = 0, start = 0;
              for (int end = 1; end <= n; end++) {
                  if (end == n || abs(word[end] - word[end - 1]) > 2) {
                      total += ccsSegment(word, start, end, k);
                      start = end;
                  }
              }
              return total;
          }
        `,
        c: code`
          static int ccsSegment(const char* word, int lo, int hi, int k) {
              int res = 0;
              for (int u = 1; u <= 26 && (long long)u * k <= hi - lo; u++) {
                  int w = u * k;
                  int cnt[26];
                  memset(cnt, 0, sizeof(cnt));
                  int exact = 0;
                  for (int i = lo; i < hi; i++) {
                      int c = word[i] - 'a';
                      cnt[c]++;
                      if (cnt[c] == k) exact++;
                      else if (cnt[c] == k + 1) exact--;
                      if (i - lo >= w) {
                          int d = word[i - w] - 'a';
                          if (cnt[d] == k) exact--;
                          cnt[d]--;
                          if (cnt[d] == k) exact++;
                      }
                      if (i - lo >= w - 1 && exact == u) res++;
                  }
              }
              return res;
          }

          int countCompleteSubstrings(const char* word, int k) {
              int n = (int)strlen(word), total = 0, start = 0;
              for (int end = 1; end <= n; end++) {
                  int gap = end < n ? word[end] - word[end - 1] : 0;
                  if (end == n || gap > 2 || gap < -2) {
                      total += ccsSegment(word, start, end, k);
                      start = end;
                  }
              }
              return total;
          }
        `,
        csharp: code`
          static int CcsSegment(string word, int lo, int hi, int k)
          {
              int res = 0;
              for (int u = 1; u <= 26 && (long)u * k <= hi - lo; u++)
              {
                  int w = u * k;
                  var cnt = new int[26];
                  int exact = 0;
                  for (int i = lo; i < hi; i++)
                  {
                      int c = word[i] - 'a';
                      cnt[c]++;
                      if (cnt[c] == k) exact++;
                      else if (cnt[c] == k + 1) exact--;
                      if (i - lo >= w)
                      {
                          int d = word[i - w] - 'a';
                          if (cnt[d] == k) exact--;
                          cnt[d]--;
                          if (cnt[d] == k) exact++;
                      }
                      if (i - lo >= w - 1 && exact == u) res++;
                  }
              }
              return res;
          }

          public static int CountCompleteSubstrings(string word, int k)
          {
              int n = word.Length, total = 0, start = 0;
              for (int end = 1; end <= n; end++)
              {
                  if (end == n || Math.Abs(word[end] - word[end - 1]) > 2)
                  {
                      total += CcsSegment(word, start, end, k);
                      start = end;
                  }
              }
              return total;
          }
        `,
        go: code`
          func ccsSegment(word string, lo, hi, k int) int {
              res := 0
              for u := 1; u <= 26 && u*k <= hi-lo; u++ {
                  w := u * k
                  cnt := make([]int, 26)
                  exact := 0
                  for i := lo; i < hi; i++ {
                      c := int(word[i] - 'a')
                      cnt[c]++
                      if cnt[c] == k {
                          exact++
                      } else if cnt[c] == k+1 {
                          exact--
                      }
                      if i-lo >= w {
                          d := int(word[i-w] - 'a')
                          if cnt[d] == k {
                              exact--
                          }
                          cnt[d]--
                          if cnt[d] == k {
                              exact++
                          }
                      }
                      if i-lo >= w-1 && exact == u {
                          res++
                      }
                  }
              }
              return res
          }

          func countCompleteSubstrings(word string, k int) int {
              n, total, start := len(word), 0, 0
              for end := 1; end <= n; end++ {
                  cut := end == n
                  if !cut {
                      gap := int(word[end]) - int(word[end-1])
                      cut = gap > 2 || gap < -2
                  }
                  if cut {
                      total += ccsSegment(word, start, end, k)
                      start = end
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun ccsSegment(word: String, lo: Int, hi: Int, k: Int): Int {
              var res = 0
              var u = 1
              while (u <= 26 && u.toLong() * k <= hi - lo) {
                  val w = u * k
                  val cnt = IntArray(26)
                  var exact = 0
                  for (i in lo until hi) {
                      val c = word[i] - 'a'
                      cnt[c]++
                      if (cnt[c] == k) exact++ else if (cnt[c] == k + 1) exact--
                      if (i - lo >= w) {
                          val d = word[i - w] - 'a'
                          if (cnt[d] == k) exact--
                          cnt[d]--
                          if (cnt[d] == k) exact++
                      }
                      if (i - lo >= w - 1 && exact == u) res++
                  }
                  u++
              }
              return res
          }

          fun countCompleteSubstrings(word: String, k: Int): Int {
              val n = word.length
              var total = 0
              var start = 0
              for (end in 1..n) {
                  if (end == n || Math.abs(word[end] - word[end - 1]) > 2) {
                      total += ccsSegment(word, start, end, k)
                      start = end
                  }
              }
              return total
          }
        `,
        swift: code`
          func ccsSegment(_ a: [Int], _ lo: Int, _ hi: Int, _ k: Int) -> Int {
              var res = 0
              var u = 1
              while u <= 26 && u * k <= hi - lo {
                  let w = u * k
                  var cnt = [Int](repeating: 0, count: 26)
                  var exact = 0
                  for i in lo..<hi {
                      let c = a[i]
                      cnt[c] += 1
                      if cnt[c] == k { exact += 1 } else if cnt[c] == k + 1 { exact -= 1 }
                      if i - lo >= w {
                          let d = a[i - w]
                          if cnt[d] == k { exact -= 1 }
                          cnt[d] -= 1
                          if cnt[d] == k { exact += 1 }
                      }
                      if i - lo >= w - 1 && exact == u { res += 1 }
                  }
                  u += 1
              }
              return res
          }

          func countCompleteSubstrings(_ word: String, _ k: Int) -> Int {
              let a = word.utf8.map { Int($0) - 97 }
              let n = a.count
              var total = 0, start = 0
              for end in 1...n {
                  if end == n || abs(a[end] - a[end - 1]) > 2 {
                      total += ccsSegment(a, start, end, k)
                      start = end
                  }
              }
              return total
          }
        `,
        rust: code`
          fn ccs_segment(a: &[i32], lo: usize, hi: usize, k: usize) -> i32 {
              let mut res = 0;
              let mut u = 1usize;
              while u <= 26 && u * k <= hi - lo {
                  let w = u * k;
                  let mut cnt = [0usize; 26];
                  let mut exact = 0usize;
                  for i in lo..hi {
                      let c = a[i] as usize;
                      cnt[c] += 1;
                      if cnt[c] == k {
                          exact += 1;
                      } else if cnt[c] == k + 1 {
                          exact -= 1;
                      }
                      if i - lo >= w {
                          let d = a[i - w] as usize;
                          if cnt[d] == k {
                              exact -= 1;
                          }
                          cnt[d] -= 1;
                          if cnt[d] == k {
                              exact += 1;
                          }
                      }
                      if i + 1 - lo >= w && exact == u {
                          res += 1;
                      }
                  }
                  u += 1;
              }
              res
          }

          fn countCompleteSubstrings(word: String, k: i32) -> i32 {
              let a: Vec<i32> = word.as_bytes().iter().map(|&c| (c - b'a') as i32).collect();
              let n = a.len();
              let mut total = 0;
              let mut start = 0usize;
              for end in 1..=n {
                  if end == n || (a[end] - a[end - 1]).abs() > 2 {
                      total += ccs_segment(&a, start, end, k as usize);
                      start = end;
                  }
              }
              total
          }
        `,
        php: code`
          function ccsSegment($word, $lo, $hi, $k) {
              $res = 0;
              for ($u = 1; $u <= 26 && $u * $k <= $hi - $lo; $u++) {
                  $w = $u * $k;
                  $cnt = array_fill(0, 26, 0);
                  $exact = 0;
                  for ($i = $lo; $i < $hi; $i++) {
                      $c = ord($word[$i]) - 97;
                      $cnt[$c]++;
                      if ($cnt[$c] == $k) $exact++;
                      elseif ($cnt[$c] == $k + 1) $exact--;
                      if ($i - $lo >= $w) {
                          $d = ord($word[$i - $w]) - 97;
                          if ($cnt[$d] == $k) $exact--;
                          $cnt[$d]--;
                          if ($cnt[$d] == $k) $exact++;
                      }
                      if ($i - $lo >= $w - 1 && $exact == $u) $res++;
                  }
              }
              return $res;
          }

          function countCompleteSubstrings($word, $k) {
              $n = strlen($word);
              $total = 0;
              $start = 0;
              for ($end = 1; $end <= $n; $end++) {
                  if ($end == $n || abs(ord($word[$end]) - ord($word[$end - 1])) > 2) {
                      $total += ccsSegment($word, $start, $end, $k);
                      $start = $end;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def ccs_segment(a, lo, hi, k)
            res = 0
            u = 1
            while u <= 26 && u * k <= hi - lo
              w = u * k
              cnt = Array.new(26, 0)
              exact = 0
              (lo...hi).each do |i|
                c = a[i]
                cnt[c] += 1
                if cnt[c] == k
                  exact += 1
                elsif cnt[c] == k + 1
                  exact -= 1
                end
                if i - lo >= w
                  d = a[i - w]
                  exact -= 1 if cnt[d] == k
                  cnt[d] -= 1
                  exact += 1 if cnt[d] == k
                end
                res += 1 if i - lo >= w - 1 && exact == u
              end
              u += 1
            end
            res
          end

          def countCompleteSubstrings(word, k)
            a = word.bytes.map { |c| c - 97 }
            n = a.length
            total = 0
            start = 0
            (1..n).each do |e|
              if e == n || (a[e] - a[e - 1]).abs > 2
                total += ccs_segment(a, start, e, k)
                start = e
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Find the String with LCP (LC 2573) ──────────────────────────
  (() => {
    const lcpOf = (s: string): number[][] => {
      const n = s.length;
      const m = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
      for (let i = n - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) m[i][j] = s[i] === s[j] ? m[i + 1][j + 1] + 1 : 0;
      return m.slice(0, n).map((row) => row.slice(0, n));
    };
    // Lexicographic search over restricted-growth strings (letters introduced
    // in order), pruned on "equal letters iff lcp > 0", with the full matrix
    // compared at the leaf.
    const ref = (lcp: number[][]): string => {
      const n = lcp.length;
      const a: number[] = [];
      const target = JSON.stringify(lcp);
      const dfs = (pos: number, used: number): string | null => {
        if (pos === n) {
          const s = a.map((c) => String.fromCharCode(97 + c)).join("");
          return JSON.stringify(lcpOf(s)) === target ? s : null;
        }
        for (let c = 0; c <= Math.min(used, 25); c++) {
          let ok = true;
          for (let j = 0; j < pos && ok; j++) if ((a[j] === c) !== (lcp[j][pos] > 0)) ok = false;
          if (!ok) continue;
          a[pos] = c;
          const r = dfs(pos + 1, Math.max(used, c + 1));
          if (r !== null) return r;
        }
        return null;
      };
      const r = dfs(0, 0);
      return r === null ? "" : r;
    };
    return {
      slug: "find-the-string-with-lcp",
      title: "Find the String with LCP",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Greedy", "Matrix", "Google", "Amazon"],
      signature: { funcName: "findTheString", params: [{ name: "lcp", type: "int[][]" as const }], returns: "string" as const },
      description: describe(
        "For a string `word` of length `n` made of lowercase letters, its **LCP matrix** is the `n × n` grid where `lcp[i][j]` is the length of the longest common prefix of the suffixes `word[i..n-1]` and `word[j..n-1]`.\n\n" +
        "Given an `n × n` matrix `lcp`, return the **lexicographically smallest** string `word` whose LCP matrix is exactly `lcp`. If no such string exists, return an empty string.",
        [
          { in: "lcp = [[3,1,0],[1,2,0],[0,0,1]]", out: '"aab"', note: "Positions 0 and 1 share a letter, position 2 differs; `aab` is the smallest such string and its matrix matches." },
          { in: "lcp = [[4,3,2,1],[3,3,2,1],[2,2,2,1],[1,1,1,1]]", out: '"aaaa"' },
          { in: "lcp = [[3,1,0],[1,2,0],[0,0,2]]", out: '""', note: "`lcp[2][2]` must be 1 — the suffix starting at index 2 has length 1." },
        ],
        ["1 <= n == lcp.length == lcp[i].length <= 1000", "0 <= lcp[i][j] <= n"]),
      hints: [
        "`lcp[i][j] > 0` says exactly that `word[i] == word[j]`. So the matrix fixes which positions share a letter.",
        "For the smallest string, give position 0 the letter `a`, copy it to every `j` with `lcp[0][j] > 0`, then give the next unlabelled position `b`, and so on. More than 26 groups means no answer.",
        "The labelling is only a candidate — rebuild its LCP matrix with `L[i][j] = (word[i] == word[j]) ? L[i+1][j+1] + 1 : 0` from the bottom-right corner and compare every entry with the input.",
      ],
      editorial: explain({
        idea: "The positivity pattern of `lcp` determines which positions hold equal letters, and the lexicographically smallest string with a given equality pattern introduces new letters in order of first appearance. Build that candidate greedily, then verify the whole matrix with the standard LCP recurrence.",
        steps: [
          "Walk `i` from 0 to `n - 1`. If `word[i]` is unassigned, assign it the next unused letter (fail if all 26 are used) and assign the same letter to every unassigned `j > i` with `lcp[i][j] > 0`.",
          "Verify: for `i` and `j` from `n - 1` down to 0, compute `L = (word[i] == word[j]) ? L[i+1][j+1] + 1 : 0` (with `L[n][*] = L[*][n] = 0`); if any `L != lcp[i][j]`, return the empty string. Two rolling rows suffice.",
          "Return the assigned letters as a string.",
        ],
        why: "Any valid string satisfies `word[i] == word[j] ⇔ lcp[i][j] > 0`, so all valid strings share one partition of the positions; among them, the lexicographically smallest labels the groups `a, b, c, …` in order of their first position, which is what the greedy pass does. If the input is valid, that candidate's matrix equals the input; if the candidate's matrix differs, no string can match. The recurrence is exactly how LCPs of suffixes extend, so the verification is complete.",
        time: "O(n^2)",
        space: "O(n) besides the input",
        pitfalls: [
          "Skipping verification — the matrix may be inconsistent (asymmetric, wrong diagonal, wrong lengths) even when the greedy pass succeeds.",
          "Needing a 27th letter means there is no answer.",
          "Checking only `lcp[i][j] > 0` is not enough; the exact values must match the recurrence.",
        ],
      }),
      examples: [
        { input: "[[3,1,0],[1,2,0],[0,0,1]]", expectedOutput: "aab" },
        { input: "[[4,3,2,1],[3,3,2,1],[2,2,2,1],[1,1,1,1]]", expectedOutput: "aaaa" },
        { input: "[[3,1,0],[1,2,0],[0,0,2]]", expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 19);
        let lcp: number[][];
        if (kind === 0) {
          const n = pick(rng, [26, 27]);
          lcp = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? n - i : 0)));
        } else {
          const n = ri(rng, 1, 8);
          const s = randLower(rng, n, n, pick(rng, ["a", "ab", "abc", "abcd", "abcdefgh"]));
          lcp = lcpOf(s);
          const mode = ri(rng, 0, 9);
          if (mode >= 5) {
            const i = ri(rng, 0, n - 1), j = ri(rng, 0, n - 1);
            const v = Math.max(0, Math.min(n, lcp[i][j] + pick(rng, [-1, 1, 2])));
            lcp[i][j] = v;
            if (mode >= 7) lcp[j][i] = v;
          } else if (mode === 4) {
            lcp = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(rng, 0, Math.min(2, n))));
          }
        }
        return { input: fmtIntMat(lcp), expectedOutput: ref(lcp) };
      },
      solutions: {
        python: code`
          from typing import List

          def findTheString(lcp: List[List[int]]) -> str:
              n = len(lcp)
              word = [-1] * n
              c = 0
              for i in range(n):
                  if word[i] != -1:
                      continue
                  if c == 26:
                      return ""
                  word[i] = c
                  for j in range(i + 1, n):
                      if word[j] == -1 and lcp[i][j] > 0:
                          word[j] = c
                  c += 1
              nxt = [0] * (n + 1)
              for i in range(n - 1, -1, -1):
                  cur = [0] * (n + 1)
                  row = lcp[i]
                  for j in range(n - 1, -1, -1):
                      v = nxt[j + 1] + 1 if word[i] == word[j] else 0
                      if v != row[j]:
                          return ""
                      cur[j] = v
                  nxt = cur
              return "".join(chr(97 + x) for x in word)
        `,
        javascript: code`
          var findTheString = function(lcp) {
              var n = lcp.length;
              var word = new Array(n).fill(-1);
              var c = 0;
              for (var i = 0; i < n; i++) {
                  if (word[i] !== -1) continue;
                  if (c === 26) return "";
                  word[i] = c;
                  for (var j = i + 1; j < n; j++) if (word[j] === -1 && lcp[i][j] > 0) word[j] = c;
                  c++;
              }
              var nxt = new Array(n + 1).fill(0);
              for (var i2 = n - 1; i2 >= 0; i2--) {
                  var cur = new Array(n + 1).fill(0);
                  for (var j2 = n - 1; j2 >= 0; j2--) {
                      var v = word[i2] === word[j2] ? nxt[j2 + 1] + 1 : 0;
                      if (v !== lcp[i2][j2]) return "";
                      cur[j2] = v;
                  }
                  nxt = cur;
              }
              var res = "";
              for (var k = 0; k < n; k++) res += String.fromCharCode(97 + word[k]);
              return res;
          };
        `,
        typescript: code`
          function findTheString(lcp: number[][]): string {
              var n = lcp.length;
              var word: number[] = [];
              for (var z = 0; z < n; z++) word.push(-1);
              var c = 0;
              for (var i = 0; i < n; i++) {
                  if (word[i] !== -1) continue;
                  if (c === 26) return "";
                  word[i] = c;
                  for (var j = i + 1; j < n; j++) if (word[j] === -1 && lcp[i][j] > 0) word[j] = c;
                  c++;
              }
              var nxt: number[] = [];
              for (var z2 = 0; z2 <= n; z2++) nxt.push(0);
              for (var i2 = n - 1; i2 >= 0; i2--) {
                  var cur: number[] = [];
                  for (var z3 = 0; z3 <= n; z3++) cur.push(0);
                  for (var j2 = n - 1; j2 >= 0; j2--) {
                      var v = word[i2] === word[j2] ? nxt[j2 + 1] + 1 : 0;
                      if (v !== lcp[i2][j2]) return "";
                      cur[j2] = v;
                  }
                  nxt = cur;
              }
              var res = "";
              for (var k = 0; k < n; k++) res += String.fromCharCode(97 + word[k]);
              return res;
          }
        `,
        java: code`
          public static String findTheString(int[][] lcp) {
              int n = lcp.length;
              int[] word = new int[n];
              Arrays.fill(word, -1);
              int c = 0;
              for (int i = 0; i < n; i++) {
                  if (word[i] != -1) continue;
                  if (c == 26) return "";
                  word[i] = c;
                  for (int j = i + 1; j < n; j++) if (word[j] == -1 && lcp[i][j] > 0) word[j] = c;
                  c++;
              }
              int[] nxt = new int[n + 1], cur = new int[n + 1];
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j >= 0; j--) {
                      int v = word[i] == word[j] ? nxt[j + 1] + 1 : 0;
                      if (v != lcp[i][j]) return "";
                      cur[j] = v;
                  }
                  int[] t = nxt;
                  nxt = cur;
                  cur = t;
              }
              StringBuilder sb = new StringBuilder();
              for (int x : word) sb.append((char) ('a' + x));
              return sb.toString();
          }
        `,
        cpp: code`
          string findTheString(vector<vector<int>>& lcp) {
              int n = lcp.size();
              vector<int> word(n, -1);
              int c = 0;
              for (int i = 0; i < n; i++) {
                  if (word[i] != -1) continue;
                  if (c == 26) return "";
                  word[i] = c;
                  for (int j = i + 1; j < n; j++) if (word[j] == -1 && lcp[i][j] > 0) word[j] = c;
                  c++;
              }
              vector<int> nxt(n + 1, 0), cur(n + 1, 0);
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j >= 0; j--) {
                      int v = word[i] == word[j] ? nxt[j + 1] + 1 : 0;
                      if (v != lcp[i][j]) return "";
                      cur[j] = v;
                  }
                  swap(nxt, cur);
              }
              string res;
              for (int x : word) res += (char)('a' + x);
              return res;
          }
        `,
        c: code`
          char* findTheString(int** lcp, int lcpSize, int* lcpColSize) {
              int n = lcpSize;
              char* res = (char*)malloc(n + 1);
              res[0] = '\0';
              int* word = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) word[i] = -1;
              int c = 0;
              for (int i = 0; i < n; i++) {
                  if (word[i] != -1) continue;
                  if (c == 26) {
                      free(word);
                      return res;
                  }
                  word[i] = c;
                  for (int j = i + 1; j < n; j++) if (word[j] == -1 && lcp[i][j] > 0) word[j] = c;
                  c++;
              }
              int* nxt = (int*)calloc(n + 1, sizeof(int));
              int* cur = (int*)calloc(n + 1, sizeof(int));
              int ok = 1;
              for (int i = n - 1; i >= 0 && ok; i--) {
                  for (int j = n - 1; j >= 0; j--) {
                      int v = word[i] == word[j] ? nxt[j + 1] + 1 : 0;
                      if (j >= lcpColSize[i] || v != lcp[i][j]) {
                          ok = 0;
                          break;
                      }
                      cur[j] = v;
                  }
                  int* t = nxt;
                  nxt = cur;
                  cur = t;
              }
              if (ok) {
                  for (int i = 0; i < n; i++) res[i] = (char)('a' + word[i]);
                  res[n] = '\0';
              }
              free(word);
              free(nxt);
              free(cur);
              return res;
          }
        `,
        csharp: code`
          public static string FindTheString(int[][] lcp)
          {
              int n = lcp.Length;
              var word = new int[n];
              for (int i = 0; i < n; i++) word[i] = -1;
              int c = 0;
              for (int i = 0; i < n; i++)
              {
                  if (word[i] != -1) continue;
                  if (c == 26) return "";
                  word[i] = c;
                  for (int j = i + 1; j < n; j++) if (word[j] == -1 && lcp[i][j] > 0) word[j] = c;
                  c++;
              }
              var nxt = new int[n + 1];
              var cur = new int[n + 1];
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int j = n - 1; j >= 0; j--)
                  {
                      int v = word[i] == word[j] ? nxt[j + 1] + 1 : 0;
                      if (v != lcp[i][j]) return "";
                      cur[j] = v;
                  }
                  var t = nxt;
                  nxt = cur;
                  cur = t;
              }
              var sb = new System.Text.StringBuilder();
              foreach (int x in word) sb.Append((char)('a' + x));
              return sb.ToString();
          }
        `,
        go: code`
          func findTheString(lcp [][]int) string {
              n := len(lcp)
              word := make([]int, n)
              for i := range word {
                  word[i] = -1
              }
              c := 0
              for i := 0; i < n; i++ {
                  if word[i] != -1 {
                      continue
                  }
                  if c == 26 {
                      return ""
                  }
                  word[i] = c
                  for j := i + 1; j < n; j++ {
                      if word[j] == -1 && lcp[i][j] > 0 {
                          word[j] = c
                      }
                  }
                  c++
              }
              nxt := make([]int, n+1)
              cur := make([]int, n+1)
              for i := n - 1; i >= 0; i-- {
                  for j := n - 1; j >= 0; j-- {
                      v := 0
                      if word[i] == word[j] {
                          v = nxt[j+1] + 1
                      }
                      if v != lcp[i][j] {
                          return ""
                      }
                      cur[j] = v
                  }
                  nxt, cur = cur, nxt
              }
              b := make([]byte, n)
              for i, x := range word {
                  b[i] = byte('a' + x)
              }
              return string(b)
          }
        `,
        kotlin: code`
          fun findTheString(lcp: Array<IntArray>): String {
              val n = lcp.size
              val word = IntArray(n) { -1 }
              var c = 0
              for (i in 0 until n) {
                  if (word[i] != -1) continue
                  if (c == 26) return ""
                  word[i] = c
                  for (j in i + 1 until n) if (word[j] == -1 && lcp[i][j] > 0) word[j] = c
                  c++
              }
              var nxt = IntArray(n + 1)
              var cur = IntArray(n + 1)
              for (i in n - 1 downTo 0) {
                  for (j in n - 1 downTo 0) {
                      val v = if (word[i] == word[j]) nxt[j + 1] + 1 else 0
                      if (v != lcp[i][j]) return ""
                      cur[j] = v
                  }
                  val t = nxt
                  nxt = cur
                  cur = t
              }
              val sb = StringBuilder()
              for (x in word) sb.append('a' + x)
              return sb.toString()
          }
        `,
        swift: code`
          func findTheString(_ lcp: [[Int]]) -> String {
              let n = lcp.count
              var word = [Int](repeating: -1, count: n)
              var c = 0
              for i in 0..<n {
                  if word[i] != -1 { continue }
                  if c == 26 { return "" }
                  word[i] = c
                  var j = i + 1
                  while j < n {
                      if word[j] == -1 && lcp[i][j] > 0 { word[j] = c }
                      j += 1
                  }
                  c += 1
              }
              var nxt = [Int](repeating: 0, count: n + 1)
              var cur = [Int](repeating: 0, count: n + 1)
              var i = n - 1
              while i >= 0 {
                  var j = n - 1
                  while j >= 0 {
                      let v = word[i] == word[j] ? nxt[j + 1] + 1 : 0
                      if v != lcp[i][j] { return "" }
                      cur[j] = v
                      j -= 1
                  }
                  swap(&nxt, &cur)
                  i -= 1
              }
              return String(decoding: word.map { UInt8($0 + 97) }, as: UTF8.self)
          }
        `,
        rust: code`
          fn findTheString(lcp: Vec<Vec<i32>>) -> String {
              let n = lcp.len();
              let mut word = vec![-1i32; n];
              let mut c = 0i32;
              for i in 0..n {
                  if word[i] != -1 {
                      continue;
                  }
                  if c == 26 {
                      return String::new();
                  }
                  word[i] = c;
                  for j in i + 1..n {
                      if word[j] == -1 && lcp[i][j] > 0 {
                          word[j] = c;
                      }
                  }
                  c += 1;
              }
              let mut nxt = vec![0i32; n + 1];
              let mut cur = vec![0i32; n + 1];
              for i in (0..n).rev() {
                  for j in (0..n).rev() {
                      let v = if word[i] == word[j] { nxt[j + 1] + 1 } else { 0 };
                      if v != lcp[i][j] {
                          return String::new();
                      }
                      cur[j] = v;
                  }
                  std::mem::swap(&mut nxt, &mut cur);
              }
              word.iter().map(|&x| (b'a' + x as u8) as char).collect()
          }
        `,
        php: code`
          function findTheString($lcp) {
              $n = count($lcp);
              $word = array_fill(0, $n, -1);
              $c = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($word[$i] != -1) continue;
                  if ($c == 26) return "";
                  $word[$i] = $c;
                  for ($j = $i + 1; $j < $n; $j++) if ($word[$j] == -1 && $lcp[$i][$j] > 0) $word[$j] = $c;
                  $c++;
              }
              $nxt = array_fill(0, $n + 1, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $cur = array_fill(0, $n + 1, 0);
                  for ($j = $n - 1; $j >= 0; $j--) {
                      $v = $word[$i] == $word[$j] ? $nxt[$j + 1] + 1 : 0;
                      if ($v != $lcp[$i][$j]) return "";
                      $cur[$j] = $v;
                  }
                  $nxt = $cur;
              }
              $res = "";
              foreach ($word as $x) $res .= chr(97 + $x);
              return $res;
          }
        `,
        ruby: code`
          def findTheString(lcp)
            n = lcp.length
            word = Array.new(n, -1)
            c = 0
            n.times do |i|
              next if word[i] != -1
              return "" if c == 26
              word[i] = c
              (i + 1...n).each { |j| word[j] = c if word[j] == -1 && lcp[i][j] > 0 }
              c += 1
            end
            nxt = Array.new(n + 1, 0)
            (n - 1).downto(0) do |i|
              cur = Array.new(n + 1, 0)
              (n - 1).downto(0) do |j|
                v = word[i] == word[j] ? nxt[j + 1] + 1 : 0
                return "" if v != lcp[i][j]
                cur[j] = v
              end
              nxt = cur
            end
            word.map { |x| (97 + x).chr }.join
          end
        `,
      },
    };
  })(),

  // ── Distinct Echo Substrings (LC 1316) ──────────────────────────
  (() => {
    const ref = (text: string): number => {
      const seen = new Set<string>();
      for (let i = 0; i < text.length; i++) {
        for (let len = 1; i + 2 * len <= text.length; len++) {
          const a = text.slice(i, i + len);
          if (a === text.slice(i + len, i + 2 * len)) seen.add(a);
        }
      }
      return seen.size;
    };
    return {
      slug: "distinct-echo-substrings",
      title: "Distinct Echo Substrings",
      difficulty: "HARD" as const,
      tags: ["String", "Trie", "Rolling Hash", "Hash Table", "Google", "Amazon"],
      signature: { funcName: "distinctEchoSubstrings", params: [{ name: "text", type: "string" as const }], returns: "int" as const },
      description: describe(
        "An **echo** is a non-empty string that is some string written twice in a row, `a + a` (for example `abab` or `zz`).\n\n" +
        "Return the number of **distinct** non-empty substrings of `text` that are echoes. Equal substrings found at different positions count once.",
        [
          { in: 'text = "kaikai"', out: "1", note: "Only `kaikai` itself (`kai` + `kai`)." },
          { in: 'text = "aaaa"', out: "2", note: "`aa` and `aaaa`." },
          { in: 'text = "abababab"', out: "3", note: "`abab`, `baba` and `abababab`." },
        ],
        ["1 <= text.length <= 2000", "text has only lowercase English letters"]),
      hints: [
        "An echo of length `2L` starting at `i` needs `text[i..i+L) == text[i+L..i+2L)`, i.e. the suffixes at `i` and `i + L` share at least `L` characters.",
        "Precompute `lcp[i][j]`, the longest common prefix of the suffixes starting at `i` and `j`, with `lcp[i][j] = lcp[i+1][j+1] + 1` when the characters match. Every echo test is then `O(1)`.",
        "To count each distinct echo once, only count an occurrence if the same substring did not occur earlier: `text[i..i+2L)` appeared at some `j < i` exactly when `lcp[j][i] >= 2L`. Precompute the maximum of `lcp[j][i]` over `j < i`.",
      ],
      editorial: explain({
        idea: "With an all-pairs suffix LCP table, both questions — \"is this an echo?\" and \"has this exact substring appeared earlier?\" — become `O(1)` comparisons, so every (start, half-length) pair is tested once and each distinct echo is counted at its first occurrence.",
        steps: [
          "Build `lcp[i][j]` for `0 <= i < j < n` from the bottom-right: `lcp[i][j] = text[i] == text[j] ? lcp[i+1][j+1] + 1 : 0`.",
          "For each start `i`, let `prev[i]` be the maximum of `lcp[j][i]` over `j < i` — the longest prefix of the suffix at `i` that also starts somewhere earlier.",
          "For each `i` and each half-length `L` with `i + 2L <= n`: the substring `text[i..i+2L)` is an echo if `lcp[i][i+L] >= L`, and it is a first occurrence if `prev[i] < 2L`. Count it when both hold.",
          "Return the count.",
        ],
        why: "`lcp[i][i+L] >= L` is exactly the statement that the two halves are equal. A substring of length `2L` starting at `i` occurs earlier iff some `j < i` has `lcp[j][i] >= 2L`, iff `prev[i] >= 2L`. So each distinct echo is counted precisely at its leftmost occurrence and nowhere else.",
        time: "O(n^2)",
        space: "O(n^2) for the table",
        pitfalls: [
          "Putting the substrings themselves in a set costs `O(n)` per insertion — `O(n^3)` in the worst case.",
          "A rolling hash works but risks collisions unless double-hashed; the LCP table is exact.",
          "`aaaa` contains `aa` three times but it is one distinct echo.",
        ],
      }),
      examples: [
        { input: '"kaikai"', expectedOutput: "1" },
        { input: '"aaaa"', expectedOutput: "2" },
        { input: '"abababab"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 9);
        let text: string;
        if (kind <= 1) text = "a".repeat(ri(rng, 1, 30));
        else if (kind <= 4) {
          const unit = randLower(rng, 1, 4, pick(rng, ["ab", "abc"]));
          text = (randLower(rng, 0, 3, "abc") + unit.repeat(ri(rng, 1, 8)) + randLower(rng, 0, 3, "abc")).slice(0, 36);
        } else text = randLower(rng, 1, 36, pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]));
        return { input: `"${text}"`, expectedOutput: String(ref(text)) };
      },
      solutions: {
        python: code`
          def distinctEchoSubstrings(text: str) -> int:
              n = len(text)
              lcp = [[0] * (n + 1) for _ in range(n + 1)]
              for i in range(n - 1, -1, -1):
                  row, below = lcp[i], lcp[i + 1]
                  ci = text[i]
                  for j in range(n - 1, i, -1):
                      if text[j] == ci:
                          row[j] = below[j + 1] + 1
              count = 0
              for i in range(n):
                  prev = 0
                  for j in range(i):
                      if lcp[j][i] > prev:
                          prev = lcp[j][i]
                  row = lcp[i]
                  for half in range(1, (n - i) // 2 + 1):
                      if row[i + half] >= half and prev < 2 * half:
                          count += 1
              return count
        `,
        javascript: code`
          var distinctEchoSubstrings = function(text) {
              var n = text.length;
              var lcp = [];
              for (var r = 0; r <= n; r++) lcp.push(new Int32Array(n + 1));
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = n - 1; j > i; j--) {
                      if (text.charCodeAt(i) === text.charCodeAt(j)) lcp[i][j] = lcp[i + 1][j + 1] + 1;
                  }
              }
              var count = 0;
              for (var i2 = 0; i2 < n; i2++) {
                  var prev = 0;
                  for (var j2 = 0; j2 < i2; j2++) if (lcp[j2][i2] > prev) prev = lcp[j2][i2];
                  for (var half = 1; i2 + 2 * half <= n; half++) {
                      if (lcp[i2][i2 + half] >= half && prev < 2 * half) count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function distinctEchoSubstrings(text: string): number {
              var n = text.length;
              var lcp: number[][] = [];
              for (var r = 0; r <= n; r++) {
                  var row: number[] = [];
                  for (var z = 0; z <= n; z++) row.push(0);
                  lcp.push(row);
              }
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = n - 1; j > i; j--) {
                      if (text.charCodeAt(i) === text.charCodeAt(j)) lcp[i][j] = lcp[i + 1][j + 1] + 1;
                  }
              }
              var count = 0;
              for (var i2 = 0; i2 < n; i2++) {
                  var prev = 0;
                  for (var j2 = 0; j2 < i2; j2++) if (lcp[j2][i2] > prev) prev = lcp[j2][i2];
                  for (var half = 1; i2 + 2 * half <= n; half++) {
                      if (lcp[i2][i2 + half] >= half && prev < 2 * half) count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int distinctEchoSubstrings(String text) {
              int n = text.length();
              int[][] lcp = new int[n + 1][n + 1];
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j > i; j--) {
                      if (text.charAt(i) == text.charAt(j)) lcp[i][j] = lcp[i + 1][j + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 0; i < n; i++) {
                  int prev = 0;
                  for (int j = 0; j < i; j++) prev = Math.max(prev, lcp[j][i]);
                  for (int half = 1; i + 2 * half <= n; half++) {
                      if (lcp[i][i + half] >= half && prev < 2 * half) count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int distinctEchoSubstrings(string text) {
              int n = text.size();
              vector<vector<int>> lcp(n + 1, vector<int>(n + 1, 0));
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j > i; j--) {
                      if (text[i] == text[j]) lcp[i][j] = lcp[i + 1][j + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 0; i < n; i++) {
                  int prev = 0;
                  for (int j = 0; j < i; j++) prev = max(prev, lcp[j][i]);
                  for (int half = 1; i + 2 * half <= n; half++) {
                      if (lcp[i][i + half] >= half && prev < 2 * half) count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          int distinctEchoSubstrings(const char* text) {
              int n = (int)strlen(text);
              int w = n + 1;
              int* lcp = (int*)calloc((size_t)w * w, sizeof(int));
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j > i; j--) {
                      if (text[i] == text[j]) lcp[i * w + j] = lcp[(i + 1) * w + j + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 0; i < n; i++) {
                  int prev = 0;
                  for (int j = 0; j < i; j++) if (lcp[j * w + i] > prev) prev = lcp[j * w + i];
                  for (int half = 1; i + 2 * half <= n; half++) {
                      if (lcp[i * w + i + half] >= half && prev < 2 * half) count++;
                  }
              }
              free(lcp);
              return count;
          }
        `,
        csharp: code`
          public static int DistinctEchoSubstrings(string text)
          {
              int n = text.Length;
              var lcp = new int[n + 1, n + 1];
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int j = n - 1; j > i; j--)
                  {
                      if (text[i] == text[j]) lcp[i, j] = lcp[i + 1, j + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 0; i < n; i++)
              {
                  int prev = 0;
                  for (int j = 0; j < i; j++) prev = Math.Max(prev, lcp[j, i]);
                  for (int half = 1; i + 2 * half <= n; half++)
                  {
                      if (lcp[i, i + half] >= half && prev < 2 * half) count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func distinctEchoSubstrings(text string) int {
              n := len(text)
              lcp := make([][]int, n+1)
              for i := range lcp {
                  lcp[i] = make([]int, n+1)
              }
              for i := n - 1; i >= 0; i-- {
                  for j := n - 1; j > i; j-- {
                      if text[i] == text[j] {
                          lcp[i][j] = lcp[i+1][j+1] + 1
                      }
                  }
              }
              count := 0
              for i := 0; i < n; i++ {
                  prev := 0
                  for j := 0; j < i; j++ {
                      if lcp[j][i] > prev {
                          prev = lcp[j][i]
                      }
                  }
                  for half := 1; i+2*half <= n; half++ {
                      if lcp[i][i+half] >= half && prev < 2*half {
                          count++
                      }
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun distinctEchoSubstrings(text: String): Int {
              val n = text.length
              val lcp = Array(n + 1) { IntArray(n + 1) }
              for (i in n - 1 downTo 0) {
                  for (j in n - 1 downTo i + 1) {
                      if (text[i] == text[j]) lcp[i][j] = lcp[i + 1][j + 1] + 1
                  }
              }
              var count = 0
              for (i in 0 until n) {
                  var prev = 0
                  for (j in 0 until i) if (lcp[j][i] > prev) prev = lcp[j][i]
                  var half = 1
                  while (i + 2 * half <= n) {
                      if (lcp[i][i + half] >= half && prev < 2 * half) count++
                      half++
                  }
              }
              return count
          }
        `,
        swift: code`
          func distinctEchoSubstrings(_ text: String) -> Int {
              let a = Array(text.utf8)
              let n = a.count
              let w = n + 1
              var lcp = [Int](repeating: 0, count: w * w)
              var i = n - 1
              while i >= 0 {
                  var j = n - 1
                  while j > i {
                      if a[i] == a[j] { lcp[i * w + j] = lcp[(i + 1) * w + j + 1] + 1 }
                      j -= 1
                  }
                  i -= 1
              }
              var count = 0
              for i in 0..<n {
                  var prev = 0
                  for j in 0..<i where lcp[j * w + i] > prev {
                      prev = lcp[j * w + i]
                  }
                  var half = 1
                  while i + 2 * half <= n {
                      if lcp[i * w + i + half] >= half && prev < 2 * half { count += 1 }
                      half += 1
                  }
              }
              return count
          }
        `,
        rust: code`
          fn distinctEchoSubstrings(text: String) -> i32 {
              let a = text.as_bytes();
              let n = a.len();
              let w = n + 1;
              let mut lcp = vec![0usize; w * w];
              for i in (0..n).rev() {
                  for j in (i + 1..n).rev() {
                      if a[i] == a[j] {
                          lcp[i * w + j] = lcp[(i + 1) * w + j + 1] + 1;
                      }
                  }
              }
              let mut count = 0;
              for i in 0..n {
                  let mut prev = 0usize;
                  for j in 0..i {
                      if lcp[j * w + i] > prev {
                          prev = lcp[j * w + i];
                      }
                  }
                  let mut half = 1;
                  while i + 2 * half <= n {
                      if lcp[i * w + i + half] >= half && prev < 2 * half {
                          count += 1;
                      }
                      half += 1;
                  }
              }
              count
          }
        `,
        php: code`
          function distinctEchoSubstrings($text) {
              $n = strlen($text);
              $lcp = array_fill(0, $n + 1, array_fill(0, $n + 1, 0));
              for ($i = $n - 1; $i >= 0; $i--) {
                  for ($j = $n - 1; $j > $i; $j--) {
                      if ($text[$i] === $text[$j]) $lcp[$i][$j] = $lcp[$i + 1][$j + 1] + 1;
                  }
              }
              $count = 0;
              for ($i = 0; $i < $n; $i++) {
                  $prev = 0;
                  for ($j = 0; $j < $i; $j++) if ($lcp[$j][$i] > $prev) $prev = $lcp[$j][$i];
                  for ($half = 1; $i + 2 * $half <= $n; $half++) {
                      if ($lcp[$i][$i + $half] >= $half && $prev < 2 * $half) $count++;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def distinctEchoSubstrings(text)
            a = text.bytes
            n = a.length
            lcp = Array.new(n + 1) { Array.new(n + 1, 0) }
            (n - 1).downto(0) do |i|
              (n - 1).downto(i + 1) do |j|
                lcp[i][j] = lcp[i + 1][j + 1] + 1 if a[i] == a[j]
              end
            end
            count = 0
            n.times do |i|
              prev = 0
              i.times { |j| prev = lcp[j][i] if lcp[j][i] > prev }
              half = 1
              while i + 2 * half <= n
                count += 1 if lcp[i][i + half] >= half && prev < 2 * half
                half += 1
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Concatenated Words (LC 472) ─────────────────────────────────
  (() => {
    const ref = (words: string[]): string[] => {
      const dict = new Set(words);
      // pieces(w, from): can w[from..] be cut into dictionary words, counting
      // how many pieces the best split uses (we need at least two overall).
      const can = (w: string, from: number, used: number): boolean => {
        if (from === w.length) return used >= 2;
        for (let to = from + 1; to <= w.length; to++) {
          if (dict.has(w.slice(from, to)) && can(w, to, used + 1)) return true;
        }
        return false;
      };
      return words.filter((w) => can(w, 0, 0));
    };
    return {
      slug: "concatenated-words",
      title: "Concatenated Words",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Depth-First Search", "Trie", "Amazon", "Google", "Meta"],
      signature: {
        funcName: "findAllConcatenatedWordsInADict",
        params: [{ name: "words", type: "string[]" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "You are given an array of **distinct** strings `words`. A **concatenated word** is a word of the array that can be written as the concatenation of **at least two** words of the array (the same word may be used more than once, but a word does not count as a concatenation of itself alone).\n\n" +
        "Return all concatenated words, **in the order they appear in `words`**.",
        [
          {
            in: 'words = ["code","kai","ro","kairo","codekairo","rocode","dsa"]', out: '["kairo","codekairo","rocode"]',
            note: "`kairo` = `kai` + `ro`, `codekairo` = `code` + `kairo` (or `code` + `kai` + `ro`), `rocode` = `ro` + `code`.",
          },
          { in: 'words = ["a","b","ab","abc"]', out: '["ab"]' },
          { in: 'words = ["x"]', out: "[]" },
        ],
        [
          "1 <= words.length <= 10^4",
          "1 <= words[i].length <= 30",
          "words[i] consists of only lowercase English letters",
          "All the strings of words are unique",
          "1 <= sum(words[i].length) <= 10^5",
        ]),
      hints: [
        "For a single word this is Word Break: can the word be cut into pieces that are all in the dictionary?",
        "Use `ok[i]` = \"the first `i` letters can be cut into dictionary words\", with `ok[0] = true` and `ok[i] = ok[j] && word[j..i) in dict` for some `j < i`.",
        "The only twist is \"at least two pieces\": when computing `ok[len]`, do not allow the single piece `word[0..len)` (that is the word itself).",
      ],
      editorial: explain({
        idea: "Run the Word Break dynamic programme on every word against a hash set of all words, forbidding the one split that uses the whole word as a single piece.",
        steps: [
          "Put every word into a hash set.",
          "For each word `w` of length `L`: set `ok[0] = true`; for `i = 1..L`, set `ok[i] = true` if some `j < i` has `ok[j]` and `w[j..i)` in the set — but when `i == L`, require `j >= 1`.",
          "If `ok[L]` is true, `w` is a concatenated word; append it to the answer (this keeps input order).",
        ],
        why: "`ok[i]` is true exactly when the prefix of length `i` splits into dictionary words, by induction on `i` (the last piece `w[j..i)` plus a valid split of the first `j` letters). Requiring `j >= 1` at `i == L` rules out precisely the one-piece split, so `ok[L]` means at least two pieces.",
        time: "O(Σ L^2) hash lookups (each of a substring of length up to 30)",
        space: "O(total length)",
        pitfalls: [
          "Without the `j >= 1` rule every word trivially matches itself.",
          "Removing the current word from the set while checking it also works, but forgetting to put it back breaks later words.",
          "A plain recursive search without memoisation can explode on words like `aaaaaaaa…b`.",
        ],
      }),
      examples: [
        { input: '["code","kai","ro","kairo","codekairo","rocode","dsa"]', expectedOutput: '["kairo","codekairo","rocode"]' },
        { input: '["a","b","ab","abc"]', expectedOutput: '["ab"]' },
        { input: '["x"]', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "xyz"]);
        const pieces: string[] = [];
        const np = ri(rng, 1, 5);
        for (let i = 0; i < np; i++) pieces.push(randLower(rng, 1, 3, alpha));
        const set = new Set<string>(pieces);
        const extra = ri(rng, 0, 9);
        for (let i = 0; i < extra; i++) {
          if (rng() < 0.65) {
            const k = ri(rng, 2, 4);
            let w = "";
            for (let j = 0; j < k; j++) w += pick(rng, pieces);
            set.add(w.slice(0, 12));
          } else set.add(randLower(rng, 1, 6, alpha));
        }
        const words = shuffle(rng, [...set]);
        return { input: fmtStrArr(words), expectedOutput: fmtStrArr(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findAllConcatenatedWordsInADict(words: List[str]) -> List[str]:
              dictionary = set(words)
              res = []
              for w in words:
                  n = len(w)
                  ok = [False] * (n + 1)
                  ok[0] = True
                  for i in range(1, n + 1):
                      for j in range(0 if i < n else 1, i):
                          if ok[j] and w[j:i] in dictionary:
                              ok[i] = True
                              break
                  if ok[n]:
                      res.append(w)
              return res
        `,
        javascript: code`
          var findAllConcatenatedWordsInADict = function(words) {
              var dict = new Set(words);
              var res = [];
              for (var k = 0; k < words.length; k++) {
                  var w = words[k], n = w.length;
                  var ok = new Array(n + 1).fill(false);
                  ok[0] = true;
                  for (var i = 1; i <= n; i++) {
                      for (var j = i < n ? 0 : 1; j < i; j++) {
                          if (ok[j] && dict.has(w.substring(j, i))) {
                              ok[i] = true;
                              break;
                          }
                      }
                  }
                  if (ok[n]) res.push(w);
              }
              return res;
          };
        `,
        typescript: code`
          function findAllConcatenatedWordsInADict(words: string[]): string[] {
              var dict: { [k: string]: boolean } = {};
              for (var q = 0; q < words.length; q++) dict["#" + words[q]] = true;
              var res: string[] = [];
              for (var k = 0; k < words.length; k++) {
                  var w = words[k], n = w.length;
                  var ok: boolean[] = [];
                  for (var z = 0; z <= n; z++) ok.push(false);
                  ok[0] = true;
                  for (var i = 1; i <= n; i++) {
                      for (var j = i < n ? 0 : 1; j < i; j++) {
                          if (ok[j] && dict.hasOwnProperty("#" + w.substring(j, i))) {
                              ok[i] = true;
                              break;
                          }
                      }
                  }
                  if (ok[n]) res.push(w);
              }
              return res;
          }
        `,
        java: code`
          public static String[] findAllConcatenatedWordsInADict(String[] words) {
              Set<String> dict = new HashSet<>(Arrays.asList(words));
              List<String> res = new ArrayList<>();
              for (String w : words) {
                  int n = w.length();
                  boolean[] ok = new boolean[n + 1];
                  ok[0] = true;
                  for (int i = 1; i <= n; i++) {
                      for (int j = i < n ? 0 : 1; j < i; j++) {
                          if (ok[j] && dict.contains(w.substring(j, i))) {
                              ok[i] = true;
                              break;
                          }
                      }
                  }
                  if (ok[n]) res.add(w);
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> findAllConcatenatedWordsInADict(vector<string>& words) {
              unordered_set<string> dict(words.begin(), words.end());
              vector<string> res;
              for (const string& w : words) {
                  int n = w.size();
                  vector<bool> ok(n + 1, false);
                  ok[0] = true;
                  for (int i = 1; i <= n; i++) {
                      for (int j = i < n ? 0 : 1; j < i; j++) {
                          if (ok[j] && dict.count(w.substr(j, i - j))) {
                              ok[i] = true;
                              break;
                          }
                      }
                  }
                  if (ok[n]) res.push_back(w);
              }
              return res;
          }
        `,
        c: code`
          typedef struct {
              const char* p;
              int len;
          } CwKey;

          static int cwKeyCmp(const void* k, const void* e) {
              const CwKey* key = (const CwKey*)k;
              const char* w = *(char* const*)e;
              int i = 0;
              while (i < key->len && w[i] != '\0') {
                  if (key->p[i] != w[i]) return (unsigned char)key->p[i] - (unsigned char)w[i];
                  i++;
              }
              if (i == key->len) return w[i] == '\0' ? 0 : -1;
              return 1;
          }

          static int cwStrCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** findAllConcatenatedWordsInADict(char** words, int wordsSize, int* returnSize) {
              char** sorted = (char**)malloc(sizeof(char*) * (wordsSize > 0 ? wordsSize : 1));
              memcpy(sorted, words, sizeof(char*) * wordsSize);
              qsort(sorted, wordsSize, sizeof(char*), cwStrCmp);
              char** res = (char**)malloc(sizeof(char*) * (wordsSize > 0 ? wordsSize : 1));
              int cnt = 0;
              for (int k = 0; k < wordsSize; k++) {
                  const char* w = words[k];
                  int n = (int)strlen(w);
                  char* ok = (char*)calloc(n + 1, 1);
                  ok[0] = 1;
                  for (int i = 1; i <= n; i++) {
                      for (int j = i < n ? 0 : 1; j < i; j++) {
                          if (!ok[j]) continue;
                          CwKey key;
                          key.p = w + j;
                          key.len = i - j;
                          if (bsearch(&key, sorted, wordsSize, sizeof(char*), cwKeyCmp) != NULL) {
                              ok[i] = 1;
                              break;
                          }
                      }
                  }
                  if (ok[n]) res[cnt++] = words[k];
                  free(ok);
              }
              free(sorted);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] FindAllConcatenatedWordsInADict(string[] words)
          {
              var dict = new HashSet<string>(words);
              var res = new List<string>();
              foreach (var w in words)
              {
                  int n = w.Length;
                  var ok = new bool[n + 1];
                  ok[0] = true;
                  for (int i = 1; i <= n; i++)
                  {
                      for (int j = i < n ? 0 : 1; j < i; j++)
                      {
                          if (ok[j] && dict.Contains(w.Substring(j, i - j)))
                          {
                              ok[i] = true;
                              break;
                          }
                      }
                  }
                  if (ok[n]) res.Add(w);
              }
              return res.ToArray();
          }
        `,
        go: code`
          func findAllConcatenatedWordsInADict(words []string) []string {
              dict := map[string]bool{}
              for _, w := range words {
                  dict[w] = true
              }
              res := []string{}
              for _, w := range words {
                  n := len(w)
                  ok := make([]bool, n+1)
                  ok[0] = true
                  for i := 1; i <= n; i++ {
                      j := 0
                      if i == n {
                          j = 1
                      }
                      for ; j < i; j++ {
                          if ok[j] && dict[w[j:i]] {
                              ok[i] = true
                              break
                          }
                      }
                  }
                  if ok[n] {
                      res = append(res, w)
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun findAllConcatenatedWordsInADict(words: Array<String>): Array<String> {
              val dict = HashSet<String>()
              for (w in words) dict.add(w)
              val res = ArrayList<String>()
              for (w in words) {
                  val n = w.length
                  val ok = BooleanArray(n + 1)
                  ok[0] = true
                  for (i in 1..n) {
                      var j = if (i < n) 0 else 1
                      while (j < i) {
                          if (ok[j] && dict.contains(w.substring(j, i))) {
                              ok[i] = true
                              break
                          }
                          j++
                      }
                  }
                  if (ok[n]) res.add(w)
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func findAllConcatenatedWordsInADict(_ words: [String]) -> [String] {
              let bytes = words.map { Array($0.utf8) }
              let dict = Set(bytes)
              var res: [String] = []
              for (k, w) in bytes.enumerated() {
                  let n = w.count
                  var ok = [Bool](repeating: false, count: n + 1)
                  ok[0] = true
                  if n >= 1 {
                      for i in 1...n {
                          var j = i < n ? 0 : 1
                          while j < i {
                              if ok[j] && dict.contains(Array(w[j..<i])) {
                                  ok[i] = true
                                  break
                              }
                              j += 1
                          }
                      }
                  }
                  if ok[n] { res.append(words[k]) }
              }
              return res
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn findAllConcatenatedWordsInADict(words: Vec<String>) -> Vec<String> {
              let dict: HashSet<&str> = words.iter().map(|w| w.as_str()).collect();
              let mut res: Vec<String> = Vec::new();
              for w in words.iter() {
                  let n = w.len();
                  let mut ok = vec![false; n + 1];
                  ok[0] = true;
                  for i in 1..=n {
                      let start = if i < n { 0 } else { 1 };
                      for j in start..i {
                          if ok[j] && dict.contains(&w[j..i]) {
                              ok[i] = true;
                              break;
                          }
                      }
                  }
                  if ok[n] {
                      res.push(w.clone());
                  }
              }
              res
          }
        `,
        php: code`
          function findAllConcatenatedWordsInADict($words) {
              $dict = [];
              foreach ($words as $w) $dict["#" . $w] = true;
              $res = [];
              foreach ($words as $w) {
                  $n = strlen($w);
                  $ok = array_fill(0, $n + 1, false);
                  $ok[0] = true;
                  for ($i = 1; $i <= $n; $i++) {
                      for ($j = $i < $n ? 0 : 1; $j < $i; $j++) {
                          if ($ok[$j] && isset($dict["#" . substr($w, $j, $i - $j)])) {
                              $ok[$i] = true;
                              break;
                          }
                      }
                  }
                  if ($ok[$n]) $res[] = $w;
              }
              return $res;
          }
        `,
        ruby: code`
          def findAllConcatenatedWordsInADict(words)
            dict = {}
            words.each { |w| dict[w] = true }
            res = []
            words.each do |w|
              n = w.length
              ok = Array.new(n + 1, false)
              ok[0] = true
              (1..n).each do |i|
                j = i < n ? 0 : 1
                while j < i
                  if ok[j] && dict.key?(w[j...i])
                    ok[i] = true
                    break
                  end
                  j += 1
                end
              end
              res << w if ok[n]
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Palindrome Pairs (LC 336) ───────────────────────────────────
  (() => {
    const isPal = (w: string) => w === w.split("").reverse().join("");
    const ref = (words: string[]): number[][] => {
      const res: number[][] = [];
      for (let i = 0; i < words.length; i++) {
        for (let j = 0; j < words.length; j++) if (i !== j && isPal(words[i] + words[j])) res.push([i, j]);
      }
      return res;
    };
    return {
      slug: "palindrome-pairs",
      title: "Palindrome Pairs",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "String", "Trie", "Airbnb", "Google", "Amazon"],
      signature: { funcName: "palindromePairs", params: [{ name: "words", type: "string[]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an array of **unique** strings `words` (a word may be the empty string).\n\n" +
        "A **palindrome pair** is a pair of indices `[i, j]` with `i != j` such that `words[i] + words[j]` (the two words concatenated) is a palindrome.\n\n" +
        "Return all palindrome pairs, **sorted** by `i` and then by `j`.",
        [
          {
            in: 'words = ["code","edoc","x","","kayak"]', out: "[[0,1],[1,0],[2,3],[3,2],[3,4],[4,3]]",
            note: "`codeedoc` and `edoccode` are palindromes, and the empty word pairs with every palindromic word on either side.",
          },
          { in: 'words = ["kai","iak","ak"]', out: "[[0,1],[0,2],[1,0]]", note: "`kaiiak`, `kaiak` and `iakkai`." },
          { in: 'words = ["a",""]', out: "[[0,1],[1,0]]" },
        ],
        ["1 <= words.length <= 5000", "0 <= words[i].length <= 300", "words[i] consists of lowercase English letters", "All the strings in words are unique"]),
      hints: [
        "Trying every pair is `O(n^2 · L)`. Instead, for each word, ask which **partner** would complete it to a palindrome.",
        "Split `w` into `prefix + suffix`. If `prefix` is a palindrome, then `reverse(suffix) + w` is a palindrome — so look up `reverse(suffix)` in a hash map of words.",
        "Symmetrically, if `suffix` is a palindrome, `w + reverse(prefix)` is a palindrome. Skip the second check for the split where `suffix` is empty, or pairs of equal-length words are found twice.",
      ],
      editorial: explain({
        idea: "If `a + b` is a palindrome, the longer word splits into a palindromic piece and a piece that is the reverse of the shorter word. So for each word and each of its `L + 1` split points, two hash lookups find every partner.",
        steps: [
          "Map every word to its index.",
          "For each word `w` at index `i` and each cut `0 <= k <= |w|`, let `pre = w[0..k)` and `suf = w[k..)`.",
          "If `pre` is a palindrome and `reverse(suf)` is a word at index `j != i`, record `[j, i]` (`reverse(suf) + pre + suf` is a palindrome).",
          "If `k != |w|`, `suf` is a palindrome and `reverse(pre)` is a word at index `j != i`, record `[i, j]` (`pre + suf + reverse(pre)` is a palindrome).",
          "Sort the recorded pairs.",
        ],
        why: "Take a palindrome pair `a + b`. If `|a| >= |b|`, then `a` starts with `reverse(b)` and the rest of `a` is a palindrome — that is the second rule applied to `a` with `k = |b|`. If `|a| <= |b|`, then `b` ends with `reverse(a)` and the start of `b` is a palindrome — the first rule applied to `b`. When `|a| == |b|` both rules would fire; excluding `k = |w|` in the second rule keeps exactly one of them, so every pair is produced once.",
        time: "O(n · L^2)",
        space: "O(n · L)",
        pitfalls: [
          "The empty word pairs with every palindromic word in both orders.",
          "A word must not pair with itself (`j != i`), even when it is a palindrome.",
          "Without the `k != |w|` guard, pairs of equal-length words such as `code`/`edoc` appear twice.",
        ],
      }),
      examples: [
        { input: '["code","edoc","x","","kayak"]', expectedOutput: "[[0,1],[1,0],[2,3],[3,2],[3,4],[4,3]]" },
        { input: '["kai","iak","ak"]', expectedOutput: "[[0,1],[0,2],[1,0]]" },
        { input: '["a",""]', expectedOutput: "[[0,1],[1,0]]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "ab", "abc", "a"]);
        const target = ri(rng, 1, pick(rng, [4, 8, 12]));
        const set = new Set<string>();
        let guard = 0;
        while (set.size < target && guard++ < 200) {
          if (set.size && rng() < 0.35) {
            const base = pick(rng, [...set]);
            const r = base.split("").reverse().join("");
            set.add(rng() < 0.5 ? r : r.slice(0, ri(rng, 0, r.length)));
          } else set.add(randLower(rng, 0, alpha === "a" ? 6 : 5, alpha));
        }
        const words = shuffle(rng, [...set]);
        return { input: fmtStrArr(words), expectedOutput: fmtIntMat(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def palindromePairs(words: List[str]) -> List[List[int]]:
              index = {w: i for i, w in enumerate(words)}
              res = []
              for i, w in enumerate(words):
                  n = len(w)
                  for k in range(n + 1):
                      pre, suf = w[:k], w[k:]
                      if pre == pre[::-1]:
                          j = index.get(suf[::-1])
                          if j is not None and j != i:
                              res.append([j, i])
                      if k != n and suf == suf[::-1]:
                          j = index.get(pre[::-1])
                          if j is not None and j != i:
                              res.append([i, j])
              res.sort()
              return res
        `,
        javascript: code`
          var palindromePairs = function(words) {
              var index = new Map();
              for (var q = 0; q < words.length; q++) index.set(words[q], q);
              var isPal = function(w, lo, hi) {
                  hi--;
                  while (lo < hi) {
                      if (w[lo] !== w[hi]) return false;
                      lo++;
                      hi--;
                  }
                  return true;
              };
              var rev = function(w, lo, hi) {
                  var r = "";
                  for (var t = hi - 1; t >= lo; t--) r += w[t];
                  return r;
              };
              var res = [];
              for (var i = 0; i < words.length; i++) {
                  var w = words[i], n = w.length;
                  for (var k = 0; k <= n; k++) {
                      if (isPal(w, 0, k)) {
                          var j = index.get(rev(w, k, n));
                          if (j !== undefined && j !== i) res.push([j, i]);
                      }
                      if (k !== n && isPal(w, k, n)) {
                          var j2 = index.get(rev(w, 0, k));
                          if (j2 !== undefined && j2 !== i) res.push([i, j2]);
                      }
                  }
              }
              res.sort(function(a, b) { return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]; });
              return res;
          };
        `,
        typescript: code`
          function ppIsPal(w: string, lo: number, hi: number): boolean {
              hi--;
              while (lo < hi) {
                  if (w.charAt(lo) !== w.charAt(hi)) return false;
                  lo++;
                  hi--;
              }
              return true;
          }

          function ppRev(w: string, lo: number, hi: number): string {
              var r = "";
              for (var t = hi - 1; t >= lo; t--) r += w.charAt(t);
              return r;
          }

          function palindromePairs(words: string[]): number[][] {
              var index: { [k: string]: number } = {};
              for (var q = 0; q < words.length; q++) index["#" + words[q]] = q;
              var res: number[][] = [];
              for (var i = 0; i < words.length; i++) {
                  var w = words[i], n = w.length;
                  for (var k = 0; k <= n; k++) {
                      if (ppIsPal(w, 0, k)) {
                          var key = "#" + ppRev(w, k, n);
                          if (index.hasOwnProperty(key) && index[key] !== i) res.push([index[key], i]);
                      }
                      if (k !== n && ppIsPal(w, k, n)) {
                          var key2 = "#" + ppRev(w, 0, k);
                          if (index.hasOwnProperty(key2) && index[key2] !== i) res.push([i, index[key2]]);
                      }
                  }
              }
              res.sort(function(a: number[], b: number[]) { return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]; });
              return res;
          }
        `,
        java: code`
          static boolean ppIsPal(String w, int lo, int hi) {
              hi--;
              while (lo < hi) {
                  if (w.charAt(lo) != w.charAt(hi)) return false;
                  lo++;
                  hi--;
              }
              return true;
          }

          public static int[][] palindromePairs(String[] words) {
              Map<String, Integer> index = new HashMap<>();
              for (int q = 0; q < words.length; q++) index.put(words[q], q);
              List<int[]> res = new ArrayList<>();
              for (int i = 0; i < words.length; i++) {
                  String w = words[i];
                  int n = w.length();
                  for (int k = 0; k <= n; k++) {
                      if (ppIsPal(w, 0, k)) {
                          Integer j = index.get(new StringBuilder(w.substring(k)).reverse().toString());
                          if (j != null && j != i) res.add(new int[]{j, i});
                      }
                      if (k != n && ppIsPal(w, k, n)) {
                          Integer j = index.get(new StringBuilder(w.substring(0, k)).reverse().toString());
                          if (j != null && j != i) res.add(new int[]{i, j});
                      }
                  }
              }
              res.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
              return res.toArray(new int[0][]);
          }
        `,
        cpp: code`
          static bool ppIsPal(const string& w, int lo, int hi) {
              hi--;
              while (lo < hi) {
                  if (w[lo] != w[hi]) return false;
                  lo++;
                  hi--;
              }
              return true;
          }

          vector<vector<int>> palindromePairs(vector<string>& words) {
              unordered_map<string, int> index;
              for (int q = 0; q < (int)words.size(); q++) index[words[q]] = q;
              vector<vector<int>> res;
              for (int i = 0; i < (int)words.size(); i++) {
                  const string& w = words[i];
                  int n = w.size();
                  for (int k = 0; k <= n; k++) {
                      if (ppIsPal(w, 0, k)) {
                          string back(w.rbegin(), w.rbegin() + (n - k));
                          auto it = index.find(back);
                          if (it != index.end() && it->second != i) res.push_back({it->second, i});
                      }
                      if (k != n && ppIsPal(w, k, n)) {
                          string back(w.rend() - k, w.rend());
                          auto it = index.find(back);
                          if (it != index.end() && it->second != i) res.push_back({i, it->second});
                      }
                  }
              }
              sort(res.begin(), res.end());
              return res;
          }
        `,
        c: code`
          typedef struct {
              const char* s;
              int idx;
          } PpEntry;

          static int ppEntryCmp(const void* a, const void* b) {
              return strcmp(((const PpEntry*)a)->s, ((const PpEntry*)b)->s);
          }

          static int ppFind(const PpEntry* arr, int n, const char* key) {
              int lo = 0, hi = n - 1;
              while (lo <= hi) {
                  int mid = (lo + hi) / 2;
                  int c = strcmp(arr[mid].s, key);
                  if (c == 0) return arr[mid].idx;
                  if (c < 0) lo = mid + 1;
                  else hi = mid - 1;
              }
              return -1;
          }

          static int ppIsPal(const char* w, int lo, int hi) {
              hi--;
              while (lo < hi) {
                  if (w[lo] != w[hi]) return 0;
                  lo++;
                  hi--;
              }
              return 1;
          }

          static int ppPairCmp(const void* a, const void* b) {
              const int* x = *(int* const*)a;
              const int* y = *(int* const*)b;
              if (x[0] != y[0]) return (x[0] > y[0]) - (x[0] < y[0]);
              return (x[1] > y[1]) - (x[1] < y[1]);
          }

          static int** ppRes;
          static int ppCnt, ppCap;

          static void ppAdd(int a, int b) {
              if (ppCnt == ppCap) {
                  ppCap = ppCap ? ppCap * 2 : 16;
                  ppRes = (int**)realloc(ppRes, sizeof(int*) * ppCap);
              }
              int* p = (int*)malloc(sizeof(int) * 2);
              p[0] = a;
              p[1] = b;
              ppRes[ppCnt++] = p;
          }

          int** palindromePairs(char** words, int wordsSize, int* returnSize, int** returnColumnSizes) {
              PpEntry* arr = (PpEntry*)malloc(sizeof(PpEntry) * (wordsSize > 0 ? wordsSize : 1));
              for (int i = 0; i < wordsSize; i++) {
                  arr[i].s = words[i];
                  arr[i].idx = i;
              }
              qsort(arr, wordsSize, sizeof(PpEntry), ppEntryCmp);
              ppRes = NULL;
              ppCnt = 0;
              ppCap = 0;
              for (int i = 0; i < wordsSize; i++) {
                  const char* w = words[i];
                  int n = (int)strlen(w);
                  char* buf = (char*)malloc(n + 1);
                  for (int k = 0; k <= n; k++) {
                      if (ppIsPal(w, 0, k)) {
                          int L = n - k;
                          for (int t = 0; t < L; t++) buf[t] = w[n - 1 - t];
                          buf[L] = '\0';
                          int j = ppFind(arr, wordsSize, buf);
                          if (j >= 0 && j != i) ppAdd(j, i);
                      }
                      if (k != n && ppIsPal(w, k, n)) {
                          for (int t = 0; t < k; t++) buf[t] = w[k - 1 - t];
                          buf[k] = '\0';
                          int j = ppFind(arr, wordsSize, buf);
                          if (j >= 0 && j != i) ppAdd(i, j);
                      }
                  }
                  free(buf);
              }
              free(arr);
              if (ppCnt > 1) qsort(ppRes, ppCnt, sizeof(int*), ppPairCmp);
              *returnSize = ppCnt;
              *returnColumnSizes = (int*)malloc(sizeof(int) * (ppCnt > 0 ? ppCnt : 1));
              for (int t = 0; t < ppCnt; t++) (*returnColumnSizes)[t] = 2;
              return ppRes;
          }
        `,
        csharp: code`
          static bool PpIsPal(string w, int lo, int hi)
          {
              hi--;
              while (lo < hi)
              {
                  if (w[lo] != w[hi]) return false;
                  lo++;
                  hi--;
              }
              return true;
          }

          static string PpRev(string w, int lo, int hi)
          {
              var a = new char[hi - lo];
              for (int t = 0; t < hi - lo; t++) a[t] = w[hi - 1 - t];
              return new string(a);
          }

          public static int[][] PalindromePairs(string[] words)
          {
              var index = new Dictionary<string, int>();
              for (int q = 0; q < words.Length; q++) index[words[q]] = q;
              var res = new List<int[]>();
              for (int i = 0; i < words.Length; i++)
              {
                  string w = words[i];
                  int n = w.Length;
                  for (int k = 0; k <= n; k++)
                  {
                      int j;
                      if (PpIsPal(w, 0, k) && index.TryGetValue(PpRev(w, k, n), out j) && j != i) res.Add(new int[] { j, i });
                      if (k != n && PpIsPal(w, k, n) && index.TryGetValue(PpRev(w, 0, k), out j) && j != i) res.Add(new int[] { i, j });
                  }
              }
              res.Sort((a, b) => a[0] != b[0] ? a[0].CompareTo(b[0]) : a[1].CompareTo(b[1]));
              return res.ToArray();
          }
        `,
        go: code`
          func ppIsPal(w string, lo, hi int) bool {
              hi--
              for lo < hi {
                  if w[lo] != w[hi] {
                      return false
                  }
                  lo++
                  hi--
              }
              return true
          }

          func ppRev(w string, lo, hi int) string {
              b := make([]byte, 0, hi-lo)
              for t := hi - 1; t >= lo; t-- {
                  b = append(b, w[t])
              }
              return string(b)
          }

          func palindromePairs(words []string) [][]int {
              index := map[string]int{}
              for q, w := range words {
                  index[w] = q
              }
              res := [][]int{}
              for i, w := range words {
                  n := len(w)
                  for k := 0; k <= n; k++ {
                      if ppIsPal(w, 0, k) {
                          if j, ok := index[ppRev(w, k, n)]; ok && j != i {
                              res = append(res, []int{j, i})
                          }
                      }
                      if k != n && ppIsPal(w, k, n) {
                          if j, ok := index[ppRev(w, 0, k)]; ok && j != i {
                              res = append(res, []int{i, j})
                          }
                      }
                  }
              }
              sort.Slice(res, func(a, b int) bool {
                  if res[a][0] != res[b][0] {
                      return res[a][0] < res[b][0]
                  }
                  return res[a][1] < res[b][1]
              })
              return res
          }
        `,
        kotlin: code`
          fun ppIsPal(w: String, from: Int, until: Int): Boolean {
              var lo = from
              var hi = until - 1
              while (lo < hi) {
                  if (w[lo] != w[hi]) return false
                  lo++
                  hi--
              }
              return true
          }

          fun palindromePairs(words: Array<String>): Array<IntArray> {
              val index = HashMap<String, Int>()
              for (q in words.indices) index[words[q]] = q
              val res = ArrayList<IntArray>()
              for (i in words.indices) {
                  val w = words[i]
                  val n = w.length
                  for (k in 0..n) {
                      if (ppIsPal(w, 0, k)) {
                          val j = index[w.substring(k).reversed()]
                          if (j != null && j != i) res.add(intArrayOf(j, i))
                      }
                      if (k != n && ppIsPal(w, k, n)) {
                          val j = index[w.substring(0, k).reversed()]
                          if (j != null && j != i) res.add(intArrayOf(i, j))
                      }
                  }
              }
              res.sortWith(Comparator { a, b -> if (a[0] != b[0]) a[0].compareTo(b[0]) else a[1].compareTo(b[1]) })
              return res.toTypedArray()
          }
        `,
        swift: code`
          func ppIsPal(_ w: [UInt8], _ from: Int, _ until: Int) -> Bool {
              var lo = from, hi = until - 1
              while lo < hi {
                  if w[lo] != w[hi] { return false }
                  lo += 1
                  hi -= 1
              }
              return true
          }

          func palindromePairs(_ words: [String]) -> [[Int]] {
              let bytes = words.map { Array($0.utf8) }
              var index = [[UInt8]: Int]()
              for (q, w) in bytes.enumerated() { index[w] = q }
              var res: [[Int]] = []
              for (i, w) in bytes.enumerated() {
                  let n = w.count
                  for k in 0...n {
                      if ppIsPal(w, 0, k), let j = index[Array(w[k..<n].reversed())], j != i {
                          res.append([j, i])
                      }
                      if k != n && ppIsPal(w, k, n), let j = index[Array(w[0..<k].reversed())], j != i {
                          res.append([i, j])
                      }
                  }
              }
              res.sort { $0[0] != $1[0] ? $0[0] < $1[0] : $0[1] < $1[1] }
              return res
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn pp_is_pal(w: &[u8], from: usize, until: usize) -> bool {
              if until <= from + 1 {
                  return true;
              }
              let (mut lo, mut hi) = (from, until - 1);
              while lo < hi {
                  if w[lo] != w[hi] {
                      return false;
                  }
                  lo += 1;
                  hi -= 1;
              }
              true
          }

          fn palindromePairs(words: Vec<String>) -> Vec<Vec<i32>> {
              let mut index: HashMap<Vec<u8>, usize> = HashMap::new();
              for (q, w) in words.iter().enumerate() {
                  index.insert(w.as_bytes().to_vec(), q);
              }
              let mut res: Vec<Vec<i32>> = Vec::new();
              for (i, word) in words.iter().enumerate() {
                  let w = word.as_bytes();
                  let n = w.len();
                  for k in 0..=n {
                      if pp_is_pal(w, 0, k) {
                          let back: Vec<u8> = w[k..n].iter().rev().cloned().collect();
                          if let Some(&j) = index.get(&back) {
                              if j != i {
                                  res.push(vec![j as i32, i as i32]);
                              }
                          }
                      }
                      if k != n && pp_is_pal(w, k, n) {
                          let back: Vec<u8> = w[0..k].iter().rev().cloned().collect();
                          if let Some(&j) = index.get(&back) {
                              if j != i {
                                  res.push(vec![i as i32, j as i32]);
                              }
                          }
                      }
                  }
              }
              res.sort();
              res
          }
        `,
        php: code`
          function ppIsPal($w, $lo, $hi) {
              $hi--;
              while ($lo < $hi) {
                  if ($w[$lo] !== $w[$hi]) return false;
                  $lo++;
                  $hi--;
              }
              return true;
          }

          function palindromePairs($words) {
              $index = [];
              foreach ($words as $q => $w) $index["#" . $w] = $q;
              $res = [];
              foreach ($words as $i => $w) {
                  $n = strlen($w);
                  for ($k = 0; $k <= $n; $k++) {
                      if (ppIsPal($w, 0, $k)) {
                          $key = "#" . strrev(substr($w, $k));
                          if (isset($index[$key]) && $index[$key] != $i) $res[] = [$index[$key], $i];
                      }
                      if ($k != $n && ppIsPal($w, $k, $n)) {
                          $key = "#" . strrev(substr($w, 0, $k));
                          if (isset($index[$key]) && $index[$key] != $i) $res[] = [$i, $index[$key]];
                      }
                  }
              }
              usort($res, function ($a, $b) {
                  return $a[0] != $b[0] ? $a[0] - $b[0] : $a[1] - $b[1];
              });
              return $res;
          }
        `,
        ruby: code`
          def pp_pal?(w, lo, hi)
            hi -= 1
            while lo < hi
              return false if w[lo] != w[hi]
              lo += 1
              hi -= 1
            end
            true
          end

          def palindromePairs(words)
            index = {}
            words.each_with_index { |w, q| index[w] = q }
            res = []
            words.each_with_index do |w, i|
              n = w.length
              (0..n).each do |k|
                if pp_pal?(w, 0, k)
                  j = index[w[k..-1].reverse]
                  res << [j, i] if j && j != i
                end
                if k != n && pp_pal?(w, k, n)
                  j = index[w[0...k].reverse]
                  res << [i, j] if j && j != i
                end
              end
            end
            res.sort
          end
        `,
      },
    };
  })(),

  // ── Word Break II (LC 140) ──────────────────────────────────────
  (() => {
    const ref = (s: string, dict: string[]): string[] => {
      const set = new Set(dict);
      const out: string[] = [];
      const go = (i: number, parts: string[]) => {
        if (i === s.length) { out.push(parts.join(" ")); return; }
        for (let j = i + 1; j <= s.length; j++) {
          const w = s.slice(i, j);
          if (set.has(w)) go(j, [...parts, w]);
        }
      };
      go(0, []);
      return out.sort();
    };
    return {
      slug: "word-break-ii",
      title: "Word Break II",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "String", "Dynamic Programming", "Backtracking", "Amazon", "Google", "Meta"],
      signature: {
        funcName: "wordBreak",
        params: [{ name: "s", type: "string" as const }, { name: "wordDict", type: "string[]" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "Given a string `s` and a dictionary `wordDict` of distinct words, insert spaces into `s` to turn it into a sentence in which **every** word is in the dictionary. A dictionary word may be used any number of times.\n\n" +
        "Return **all** such sentences, sorted in ascending lexicographic order (by character code, so a space sorts before any letter). Return an empty list if there are none.",
        [
          {
            in: 's = "codekairo", wordDict = ["code","kai","ro","kairo","co","de"]',
            out: '["co de kai ro","co de kairo","code kai ro","code kairo"]',
          },
          { in: 's = "aaaa", wordDict = ["a","aa"]', out: '["a a a a","a a aa","a aa a","aa a a","aa aa"]' },
          { in: 's = "duel", wordDict = ["du","e"]', out: "[]", note: "Nothing in the dictionary ends with `l`." },
        ],
        [
          "1 <= s.length <= 20",
          "1 <= wordDict.length <= 1000",
          "1 <= wordDict[i].length <= 10",
          "s and wordDict[i] consist of only lowercase English letters",
          "All the strings of wordDict are unique",
          "The total length of the answer does not exceed 10^5",
        ]),
      hints: [
        "Build sentences left to right: at position `i`, try every dictionary word that starts there and continue from where it ends.",
        "Plain backtracking wastes time on prefixes that can never be completed. First compute `can[i]` — whether `s[i..]` can be fully segmented — from right to left.",
        "Only step to a position `j` with `can[j]` true; then every branch of the search produces at least one sentence, so the work is proportional to the output. Sort the sentences at the end.",
      ],
      editorial: explain({
        idea: "The number of sentences can be exponential, so the goal is a search whose cost is proportional to its output. A right-to-left Word Break table tells which suffixes are segmentable; the backtracking then never enters a dead end.",
        steps: [
          "Put the dictionary in a hash set.",
          "Compute `can[n] = true` and, for `i` from `n - 1` down to 0, `can[i] = true` if some `j > i` has `can[j]` and `s[i..j)` in the set.",
          "If `can[0]` is false, return an empty list.",
          "Backtrack from `i = 0` with a list of chosen words: at `i == n`, join the words with spaces and record the sentence; otherwise, for every `j > i` with `can[j]` and `s[i..j)` in the set, push the word, recurse at `j`, pop.",
          "Sort the recorded sentences.",
        ],
        why: "Every sentence is a sequence of dictionary words that tiles `s`, and the search enumerates each tiling exactly once (the cut positions determine it). Restricting steps to positions with `can[j]` only removes branches that cannot reach the end, so no sentence is lost while every explored path ends in a recorded sentence.",
        time: "O(n^2 + total output length · n)",
        space: "O(n) besides the output",
        pitfalls: [
          "Without the `can` pruning, inputs like `aaaa…ab` with dictionary `a, aa, aaa` explore exponentially many dead branches.",
          "The order is fixed: sort the final list (a space is smaller than any letter).",
          "Return an empty list, not a list with an empty sentence, when no segmentation exists.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n["code","kai","ro","kairo","co","de"]', expectedOutput: '["co de kai ro","co de kairo","code kai ro","code kairo"]' },
        { input: '"aaaa"\n["a","aa"]', expectedOutput: '["a a a a","a a aa","a aa a","aa a a","aa aa"]' },
        { input: '"duel"\n["du","e"]', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const alpha = pick(rng, ["ab", "abc", "a", "xyz"]);
          const m = ri(rng, 1, 6);
          const dict = new Set<string>();
          while (dict.size < m) {
            const w = randLower(rng, 1, 4, alpha);
            if (alpha === "a" && dict.size >= 4) break;
            dict.add(w);
          }
          const words = shuffle(rng, [...dict]);
          let s = "";
          if (rng() < 0.75) {
            const target = ri(rng, 1, 12);
            while (s.length < target) s += pick(rng, words);
            if (rng() < 0.2) s += randLower(rng, 1, 2, alpha);
          } else s = randLower(rng, 1, 12, alpha);
          if (s.length > 20) s = s.slice(0, 20);
          const out = ref(s, words);
          if (out.length > 30) continue;
          return { input: `"${s}"\n${fmtStrArr(words)}`, expectedOutput: fmtStrArr(out) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def wordBreak(s: str, wordDict: List[str]) -> List[str]:
              words = set(wordDict)
              n = len(s)
              can = [False] * (n + 1)
              can[n] = True
              for i in range(n - 1, -1, -1):
                  for j in range(i + 1, n + 1):
                      if can[j] and s[i:j] in words:
                          can[i] = True
                          break
              res = []
              parts = []

              def dfs(i):
                  if i == n:
                      res.append(" ".join(parts))
                      return
                  for j in range(i + 1, n + 1):
                      if can[j] and s[i:j] in words:
                          parts.append(s[i:j])
                          dfs(j)
                          parts.pop()

              if can[0]:
                  dfs(0)
              res.sort()
              return res
        `,
        javascript: code`
          var wordBreak = function(s, wordDict) {
              var words = new Set(wordDict);
              var n = s.length;
              var can = new Array(n + 1).fill(false);
              can[n] = true;
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = i + 1; j <= n; j++) {
                      if (can[j] && words.has(s.substring(i, j))) {
                          can[i] = true;
                          break;
                      }
                  }
              }
              var res = [], parts = [];
              var dfs = function(i) {
                  if (i === n) {
                      res.push(parts.join(" "));
                      return;
                  }
                  for (var j = i + 1; j <= n; j++) {
                      if (can[j] && words.has(s.substring(i, j))) {
                          parts.push(s.substring(i, j));
                          dfs(j);
                          parts.pop();
                      }
                  }
              };
              if (can[0]) dfs(0);
              res.sort();
              return res;
          };
        `,
        typescript: code`
          function wordBreak(s: string, wordDict: string[]): string[] {
              var words: { [k: string]: boolean } = {};
              for (var q = 0; q < wordDict.length; q++) words["#" + wordDict[q]] = true;
              var n = s.length;
              var can: boolean[] = [];
              for (var z = 0; z <= n; z++) can.push(false);
              can[n] = true;
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = i + 1; j <= n; j++) {
                      if (can[j] && words.hasOwnProperty("#" + s.substring(i, j))) {
                          can[i] = true;
                          break;
                      }
                  }
              }
              var res: string[] = [], parts: string[] = [];
              var dfs = function(i: number): void {
                  if (i === n) {
                      res.push(parts.join(" "));
                      return;
                  }
                  for (var j = i + 1; j <= n; j++) {
                      if (can[j] && words.hasOwnProperty("#" + s.substring(i, j))) {
                          parts.push(s.substring(i, j));
                          dfs(j);
                          parts.pop();
                      }
                  }
              };
              if (can[0]) dfs(0);
              res.sort();
              return res;
          }
        `,
        java: code`
          static void wbDfs(String s, int i, boolean[] can, Set<String> words, List<String> parts, List<String> res) {
              if (i == s.length()) {
                  res.add(String.join(" ", parts));
                  return;
              }
              for (int j = i + 1; j <= s.length(); j++) {
                  if (can[j] && words.contains(s.substring(i, j))) {
                      parts.add(s.substring(i, j));
                      wbDfs(s, j, can, words, parts, res);
                      parts.remove(parts.size() - 1);
                  }
              }
          }

          public static String[] wordBreak(String s, String[] wordDict) {
              Set<String> words = new HashSet<>(Arrays.asList(wordDict));
              int n = s.length();
              boolean[] can = new boolean[n + 1];
              can[n] = true;
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = i + 1; j <= n; j++) {
                      if (can[j] && words.contains(s.substring(i, j))) {
                          can[i] = true;
                          break;
                      }
                  }
              }
              List<String> res = new ArrayList<>();
              if (can[0]) wbDfs(s, 0, can, words, new ArrayList<>(), res);
              Collections.sort(res);
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          static void wbDfs(const string& s, int i, const vector<bool>& can, const unordered_set<string>& words, vector<string>& parts, vector<string>& res) {
              int n = s.size();
              if (i == n) {
                  string line;
                  for (size_t k = 0; k < parts.size(); k++) {
                      if (k) line += ' ';
                      line += parts[k];
                  }
                  res.push_back(line);
                  return;
              }
              for (int j = i + 1; j <= n; j++) {
                  if (can[j] && words.count(s.substr(i, j - i))) {
                      parts.push_back(s.substr(i, j - i));
                      wbDfs(s, j, can, words, parts, res);
                      parts.pop_back();
                  }
              }
          }

          vector<string> wordBreak(string s, vector<string>& wordDict) {
              unordered_set<string> words(wordDict.begin(), wordDict.end());
              int n = s.size();
              vector<bool> can(n + 1, false);
              can[n] = true;
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = i + 1; j <= n; j++) {
                      if (can[j] && words.count(s.substr(i, j - i))) {
                          can[i] = true;
                          break;
                      }
                  }
              }
              vector<string> res, parts;
              if (can[0]) wbDfs(s, 0, can, words, parts, res);
              sort(res.begin(), res.end());
              return res;
          }
        `,
        c: code`
          static const char* wbS;
          static int wbN;
          static char** wbDict;
          static int wbDictSize;
          static bool* wbCan;
          static char* wbBuf;
          static char** wbRes;
          static int wbCnt, wbCap;

          static bool wbIn(int i, int j) {
              int len = j - i;
              for (int d = 0; d < wbDictSize; d++) {
                  if ((int)strlen(wbDict[d]) == len && strncmp(wbDict[d], wbS + i, len) == 0) return true;
              }
              return false;
          }

          static void wbDfs(int i, int len) {
              if (i == wbN) {
                  if (wbCnt == wbCap) {
                      wbCap = wbCap ? wbCap * 2 : 16;
                      wbRes = (char**)realloc(wbRes, sizeof(char*) * wbCap);
                  }
                  char* t = (char*)malloc(len + 1);
                  memcpy(t, wbBuf, len);
                  t[len] = '\0';
                  wbRes[wbCnt++] = t;
                  return;
              }
              for (int j = i + 1; j <= wbN; j++) {
                  if (wbCan[j] && wbIn(i, j)) {
                      int p = len;
                      if (p > 0) wbBuf[p++] = ' ';
                      memcpy(wbBuf + p, wbS + i, j - i);
                      wbDfs(j, p + (j - i));
                  }
              }
          }

          static int wbCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** wordBreak(const char* s, char** wordDict, int wordDictSize, int* returnSize) {
              wbS = s;
              wbN = (int)strlen(s);
              wbDict = wordDict;
              wbDictSize = wordDictSize;
              wbCan = (bool*)calloc(wbN + 1, sizeof(bool));
              wbBuf = (char*)malloc(2 * wbN + 2);
              wbRes = NULL;
              wbCnt = 0;
              wbCap = 0;
              wbCan[wbN] = true;
              for (int i = wbN - 1; i >= 0; i--) {
                  for (int j = i + 1; j <= wbN; j++) {
                      if (wbCan[j] && wbIn(i, j)) {
                          wbCan[i] = true;
                          break;
                      }
                  }
              }
              if (wbCan[0]) wbDfs(0, 0);
              if (wbCnt > 1) qsort(wbRes, wbCnt, sizeof(char*), wbCmp);
              free(wbCan);
              free(wbBuf);
              *returnSize = wbCnt;
              if (wbRes == NULL) wbRes = (char**)malloc(sizeof(char*));
              return wbRes;
          }
        `,
        csharp: code`
          static void WbDfs(string s, int i, bool[] can, HashSet<string> words, List<string> parts, List<string> res)
          {
              if (i == s.Length)
              {
                  res.Add(string.Join(" ", parts));
                  return;
              }
              for (int j = i + 1; j <= s.Length; j++)
              {
                  if (can[j] && words.Contains(s.Substring(i, j - i)))
                  {
                      parts.Add(s.Substring(i, j - i));
                      WbDfs(s, j, can, words, parts, res);
                      parts.RemoveAt(parts.Count - 1);
                  }
              }
          }

          public static string[] WordBreak(string s, string[] wordDict)
          {
              var words = new HashSet<string>(wordDict);
              int n = s.Length;
              var can = new bool[n + 1];
              can[n] = true;
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int j = i + 1; j <= n; j++)
                  {
                      if (can[j] && words.Contains(s.Substring(i, j - i)))
                      {
                          can[i] = true;
                          break;
                      }
                  }
              }
              var res = new List<string>();
              if (can[0]) WbDfs(s, 0, can, words, new List<string>(), res);
              res.Sort(string.CompareOrdinal);
              return res.ToArray();
          }
        `,
        go: code`
          func wbDfs(s string, i int, can []bool, words map[string]bool, parts []string, res *[]string) {
              if i == len(s) {
                  *res = append(*res, strings.Join(parts, " "))
                  return
              }
              for j := i + 1; j <= len(s); j++ {
                  if can[j] && words[s[i:j]] {
                      wbDfs(s, j, can, words, append(parts, s[i:j]), res)
                  }
              }
          }

          func wordBreak(s string, wordDict []string) []string {
              words := map[string]bool{}
              for _, w := range wordDict {
                  words[w] = true
              }
              n := len(s)
              can := make([]bool, n+1)
              can[n] = true
              for i := n - 1; i >= 0; i-- {
                  for j := i + 1; j <= n; j++ {
                      if can[j] && words[s[i:j]] {
                          can[i] = true
                          break
                      }
                  }
              }
              res := []string{}
              if can[0] {
                  wbDfs(s, 0, can, words, make([]string, 0, n), &res)
              }
              sort.Strings(res)
              return res
          }
        `,
        kotlin: code`
          fun wbDfs(s: String, i: Int, can: BooleanArray, words: HashSet<String>, parts: ArrayList<String>, res: ArrayList<String>) {
              if (i == s.length) {
                  res.add(parts.joinToString(" "))
                  return
              }
              for (j in i + 1..s.length) {
                  if (can[j] && words.contains(s.substring(i, j))) {
                      parts.add(s.substring(i, j))
                      wbDfs(s, j, can, words, parts, res)
                      parts.removeAt(parts.size - 1)
                  }
              }
          }

          fun wordBreak(s: String, wordDict: Array<String>): Array<String> {
              val words = HashSet<String>()
              for (w in wordDict) words.add(w)
              val n = s.length
              val can = BooleanArray(n + 1)
              can[n] = true
              for (i in n - 1 downTo 0) {
                  for (j in i + 1..n) {
                      if (can[j] && words.contains(s.substring(i, j))) {
                          can[i] = true
                          break
                      }
                  }
              }
              val res = ArrayList<String>()
              if (can[0]) wbDfs(s, 0, can, words, ArrayList(), res)
              res.sort()
              return res.toTypedArray()
          }
        `,
        swift: code`
          func wbDfs(_ s: [UInt8], _ i: Int, _ can: [Bool], _ words: Set<[UInt8]>, _ parts: inout [[UInt8]], _ res: inout [String]) {
              if i == s.count {
                  res.append(parts.map { String(decoding: $0, as: UTF8.self) }.joined(separator: " "))
                  return
              }
              var j = i + 1
              while j <= s.count {
                  let piece = Array(s[i..<j])
                  if can[j] && words.contains(piece) {
                      parts.append(piece)
                      wbDfs(s, j, can, words, &parts, &res)
                      parts.removeLast()
                  }
                  j += 1
              }
          }

          func wordBreak(_ s: String, _ wordDict: [String]) -> [String] {
              let a = Array(s.utf8)
              let words = Set(wordDict.map { Array($0.utf8) })
              let n = a.count
              var can = [Bool](repeating: false, count: n + 1)
              can[n] = true
              var i = n - 1
              while i >= 0 {
                  var j = i + 1
                  while j <= n {
                      if can[j] && words.contains(Array(a[i..<j])) {
                          can[i] = true
                          break
                      }
                      j += 1
                  }
                  i -= 1
              }
              var res: [String] = []
              var parts: [[UInt8]] = []
              if can[0] { wbDfs(a, 0, can, words, &parts, &res) }
              res.sort()
              return res
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn wb_dfs(s: &str, i: usize, can: &[bool], words: &HashSet<&str>, parts: &mut Vec<String>, res: &mut Vec<String>) {
              if i == s.len() {
                  res.push(parts.join(" "));
                  return;
              }
              for j in i + 1..=s.len() {
                  if can[j] && words.contains(&s[i..j]) {
                      parts.push(s[i..j].to_string());
                      wb_dfs(s, j, can, words, parts, res);
                      parts.pop();
                  }
              }
          }

          fn wordBreak(s: String, wordDict: Vec<String>) -> Vec<String> {
              let words: HashSet<&str> = wordDict.iter().map(|w| w.as_str()).collect();
              let n = s.len();
              let mut can = vec![false; n + 1];
              can[n] = true;
              for i in (0..n).rev() {
                  for j in i + 1..=n {
                      if can[j] && words.contains(&s[i..j]) {
                          can[i] = true;
                          break;
                      }
                  }
              }
              let mut res: Vec<String> = Vec::new();
              let mut parts: Vec<String> = Vec::new();
              if can[0] {
                  wb_dfs(&s, 0, &can, &words, &mut parts, &mut res);
              }
              res.sort();
              res
          }
        `,
        php: code`
          function wbDfs($s, $i, $can, $words, &$parts, &$res) {
              $n = strlen($s);
              if ($i == $n) {
                  $res[] = implode(" ", $parts);
                  return;
              }
              for ($j = $i + 1; $j <= $n; $j++) {
                  $piece = substr($s, $i, $j - $i);
                  if ($can[$j] && isset($words["#" . $piece])) {
                      $parts[] = $piece;
                      wbDfs($s, $j, $can, $words, $parts, $res);
                      array_pop($parts);
                  }
              }
          }

          function wordBreak($s, $wordDict) {
              $words = [];
              foreach ($wordDict as $w) $words["#" . $w] = true;
              $n = strlen($s);
              $can = array_fill(0, $n + 1, false);
              $can[$n] = true;
              for ($i = $n - 1; $i >= 0; $i--) {
                  for ($j = $i + 1; $j <= $n; $j++) {
                      if ($can[$j] && isset($words["#" . substr($s, $i, $j - $i)])) {
                          $can[$i] = true;
                          break;
                      }
                  }
              }
              $res = [];
              $parts = [];
              if ($can[0]) wbDfs($s, 0, $can, $words, $parts, $res);
              sort($res, SORT_STRING);
              return $res;
          }
        `,
        ruby: code`
          def wb_dfs(s, i, can, words, parts, res)
            if i == s.length
              res << parts.join(" ")
              return
            end
            (i + 1..s.length).each do |j|
              piece = s[i...j]
              next unless can[j] && words.key?(piece)
              parts << piece
              wb_dfs(s, j, can, words, parts, res)
              parts.pop
            end
          end

          def wordBreak(s, wordDict)
            words = {}
            wordDict.each { |w| words[w] = true }
            n = s.length
            can = Array.new(n + 1, false)
            can[n] = true
            (n - 1).downto(0) do |i|
              (i + 1..n).each do |j|
                if can[j] && words.key?(s[i...j])
                  can[i] = true
                  break
                end
              end
            end
            res = []
            wb_dfs(s, 0, can, words, [], res) if can[0]
            res.sort
          end
        `,
      },
    };
  })(),

  // ── Fraction to Recurring Decimal (LC 166) ──────────────────────
  (() => {
    // Long division on BigInt — exact for any 32-bit inputs.
    const ref = (numerator: number, denominator: number): string => {
      if (numerator === 0) return "0";
      const neg = (numerator < 0) !== (denominator < 0);
      let num = BigInt(Math.abs(numerator));
      const den = BigInt(Math.abs(denominator));
      const whole = (num / den).toString();
      num %= den;
      if (num === BigInt(0)) return (neg ? "-" : "") + whole;
      const seen = new Map<string, number>();
      const digits: string[] = [];
      while (num !== BigInt(0)) {
        const key = num.toString();
        if (seen.has(key)) {
          const at = seen.get(key)!;
          return (neg ? "-" : "") + whole + "." + digits.slice(0, at).join("") + "(" + digits.slice(at).join("") + ")";
        }
        seen.set(key, digits.length);
        num *= BigInt(10);
        digits.push((num / den).toString());
        num %= den;
      }
      return (neg ? "-" : "") + whole + "." + digits.join("");
    };
    const SPECIAL: Array<[number, number]> = [
      [-2147483648, -1], [-2147483648, 1], [2147483647, -1], [1, -2147483648], [-1, -2147483648],
      [-2147483648, -2147483648], [2147483647, 2147483647], [0, -7], [0, 3], [-2147483648, 7], [2147483647, 1048576],
    ];
    return {
      slug: "fraction-to-recurring-decimal",
      title: "Fraction to Recurring Decimal",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "String", "Google", "Meta", "Amazon"],
      signature: {
        funcName: "fractionToDecimal",
        params: [{ name: "numerator", type: "int" as const }, { name: "denominator", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "Given two integers `numerator` and `denominator`, return the value of the fraction `numerator / denominator` written in decimal.\n\n" +
        "- If the decimal expansion terminates, write it in full with no trailing zeros (`-50 / 8` is `-6.25`; `4 / 2` is `2`).\n" +
        "- If it repeats, put the **shortest** repeating block, starting as early as possible, in parentheses (`1 / 6` is `0.1(6)`, not `0.(16)` or `0.16(6)`).\n" +
        "- A negative value starts with `-`; zero is written `0`.",
        [
          { in: "numerator = 1, denominator = 6", out: '"0.1(6)"' },
          { in: "numerator = -50, denominator = 8", out: '"-6.25"' },
          { in: "numerator = 22, denominator = 7", out: '"3.(142857)"' },
        ],
        [
          "-2^31 <= numerator, denominator <= 2^31 - 1",
          "denominator != 0",
          "The answer string is shorter than 10^4 characters for every test",
        ]),
      hints: [
        "Do the long division you learned at school: the integer part first, then one digit at a time, multiplying the remainder by 10 each step.",
        "The digits start repeating exactly when a **remainder** repeats — the next digits are determined by the remainder alone.",
        "Store, for every remainder, the position in the output where its digit was written. When a remainder shows up again, insert `(` at that position and append `)`. Work with absolute values in 64-bit and put the sign in front yourself.",
      ],
      editorial: explain({
        idea: "Each step of long division depends only on the current remainder, and there are fewer than `|denominator|` possible remainders. So the expansion either reaches remainder 0 (terminates) or revisits a remainder, and the digits produced since its first visit form the shortest earliest repeating block.",
        steps: [
          "If `numerator == 0`, return `0`. Otherwise write `-` if exactly one of the inputs is negative.",
          "Switch to 64-bit absolute values `n` and `d` (because `|-2^31|` does not fit in 32 bits). Append `n / d`; let `r = n % d`. If `r == 0`, return.",
          "Append `.`. While `r != 0`: if `r` was seen before at output position `p`, insert `(` at `p`, append `)` and stop; otherwise remember `r → current length`, set `r *= 10`, append the digit `r / d`, and set `r %= d`.",
          "Return the built string.",
        ],
        why: "The fractional digits follow `r_{k+1} = 10 · r_k mod d` and digit `10 · r_k / d`. Once some remainder repeats, the whole sequence of later digits repeats with it, so the block between the two visits repeats forever. It starts at the first remainder that recurs, which is the earliest possible start, and its length is the period of the remainder sequence, which is the shortest possible repeating block.",
        time: "O(length of the answer)",
        space: "O(length of the answer)",
        pitfalls: [
          "`-2147483648 / -1` and `abs(-2147483648)` overflow 32-bit integers — convert to 64-bit first.",
          "`0 / -5` is `0`, not `-0`.",
          "Detect repetition by remainders, not by digits — the same digit can come from different remainders.",
        ],
      }),
      examples: [
        { input: "1\n6", expectedOutput: "0.1(6)" },
        { input: "-50\n8", expectedOutput: "-6.25" },
        { input: "22\n7", expectedOutput: "3.(142857)" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 19);
        let numerator: number, denominator: number;
        if (kind === 0) [numerator, denominator] = pick(rng, SPECIAL);
        else {
          const sign = () => (rng() < 0.3 ? -1 : 1);
          if (kind <= 9) denominator = ri(rng, 1, 60);
          else if (kind <= 12) denominator = ri(rng, 1, 400);
          else if (kind <= 15) denominator = 2 ** ri(rng, 0, 12) * 5 ** ri(rng, 0, 5) * pick(rng, [1, 3, 7, 9, 11, 13]);
          else denominator = pick(rng, [2 ** ri(rng, 0, 30), 5 ** ri(rng, 0, 13), 10 ** ri(rng, 0, 9)]);
          denominator *= sign();
          numerator = sign() * (rng() < 0.5 ? ri(rng, 0, 100) : ri(rng, 0, 2147483647));
          if (numerator === -0) numerator = 0;
        }
        return { input: `${numerator}\n${denominator}`, expectedOutput: ref(numerator, denominator) };
      },
      solutions: {
        python: code`
          def fractionToDecimal(numerator: int, denominator: int) -> str:
              if numerator == 0:
                  return "0"
              sign = "-" if (numerator < 0) != (denominator < 0) else ""
              num, den = abs(numerator), abs(denominator)
              whole, rem = divmod(num, den)
              if rem == 0:
                  return sign + str(whole)
              digits = []
              seen = {}
              while rem != 0:
                  if rem in seen:
                      at = seen[rem]
                      return sign + str(whole) + "." + "".join(digits[:at]) + "(" + "".join(digits[at:]) + ")"
                  seen[rem] = len(digits)
                  rem *= 10
                  digits.append(str(rem // den))
                  rem %= den
              return sign + str(whole) + "." + "".join(digits)
        `,
        javascript: code`
          var fractionToDecimal = function(numerator, denominator) {
              if (numerator === 0) return "0";
              var sign = (numerator < 0) !== (denominator < 0) ? "-" : "";
              var num = Math.abs(numerator), den = Math.abs(denominator);
              var rem = num % den;
              var whole = (num - rem) / den;
              if (rem === 0) return sign + String(whole);
              var digits = [];
              var seen = new Map();
              while (rem !== 0) {
                  if (seen.has(rem)) {
                      var at = seen.get(rem);
                      return sign + String(whole) + "." + digits.slice(0, at).join("") + "(" + digits.slice(at).join("") + ")";
                  }
                  seen.set(rem, digits.length);
                  rem *= 10;
                  var d = Math.floor(rem / den);
                  digits.push(String(d));
                  rem -= d * den;
              }
              return sign + String(whole) + "." + digits.join("");
          };
        `,
        typescript: code`
          function fractionToDecimal(numerator: number, denominator: number): string {
              if (numerator === 0) return "0";
              var sign = (numerator < 0) !== (denominator < 0) ? "-" : "";
              var num = Math.abs(numerator), den = Math.abs(denominator);
              var rem = num % den;
              var whole = (num - rem) / den;
              if (rem === 0) return sign + String(whole);
              var digits: string[] = [];
              var seen: { [k: string]: number } = {};
              while (rem !== 0) {
                  var key = "r" + rem;
                  if (seen.hasOwnProperty(key)) {
                      var at = seen[key];
                      return sign + String(whole) + "." + digits.slice(0, at).join("") + "(" + digits.slice(at).join("") + ")";
                  }
                  seen[key] = digits.length;
                  rem *= 10;
                  var d = Math.floor(rem / den);
                  digits.push(String(d));
                  rem -= d * den;
              }
              return sign + String(whole) + "." + digits.join("");
          }
        `,
        java: code`
          public static String fractionToDecimal(int numerator, int denominator) {
              if (numerator == 0) return "0";
              StringBuilder sb = new StringBuilder();
              if ((numerator < 0) != (denominator < 0)) sb.append('-');
              long num = Math.abs((long) numerator), den = Math.abs((long) denominator);
              sb.append(num / den);
              long rem = num % den;
              if (rem == 0) return sb.toString();
              sb.append('.');
              Map<Long, Integer> seen = new HashMap<>();
              while (rem != 0) {
                  Integer at = seen.get(rem);
                  if (at != null) {
                      sb.insert((int) at, "(");
                      sb.append(')');
                      break;
                  }
                  seen.put(rem, sb.length());
                  rem *= 10;
                  sb.append(rem / den);
                  rem %= den;
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string fractionToDecimal(int numerator, int denominator) {
              if (numerator == 0) return "0";
              string res;
              if ((numerator < 0) != (denominator < 0)) res += '-';
              long long num = llabs((long long)numerator), den = llabs((long long)denominator);
              res += to_string(num / den);
              long long rem = num % den;
              if (rem == 0) return res;
              res += '.';
              unordered_map<long long, int> seen;
              while (rem != 0) {
                  auto it = seen.find(rem);
                  if (it != seen.end()) {
                      res.insert(it->second, "(");
                      res += ')';
                      break;
                  }
                  seen[rem] = res.size();
                  rem *= 10;
                  res += (char)('0' + rem / den);
                  rem %= den;
              }
              return res;
          }
        `,
        c: code`
          char* fractionToDecimal(int numerator, int denominator) {
              int cap = 64, len = 0;
              char* buf = (char*)malloc(cap);
              if (numerator == 0) {
                  strcpy(buf, "0");
                  return buf;
              }
              long long num = numerator, den = denominator;
              if ((num < 0) != (den < 0)) buf[len++] = '-';
              if (num < 0) num = -num;
              if (den < 0) den = -den;
              len += sprintf(buf + len, "%lld", num / den);
              long long rem = num % den;
              if (rem == 0) return buf;
              buf[len++] = '.';
              /* Fewer than min(den, 10^4) distinct remainders can occur, so size the
                 table from that; slot value 0 means empty (rem is never 0 here). */
              long long limit = den < 16384 ? den : 16384;
              int tsize = 16;
              while (tsize < 2 * limit) tsize <<= 1;
              long long* keys = (long long*)calloc(tsize, sizeof(long long));
              int* pos = (int*)malloc(sizeof(int) * tsize);
              while (rem != 0) {
                  unsigned long long h = ((unsigned long long)rem * 2654435761ULL) & (unsigned long long)(tsize - 1);
                  while (keys[h] != 0 && keys[h] != rem) h = (h + 1) & (unsigned long long)(tsize - 1);
                  if (keys[h] == rem) {
                      int at = pos[h];
                      memmove(buf + at + 1, buf + at, len - at);
                      buf[at] = '(';
                      len++;
                      buf[len++] = ')';
                      break;
                  }
                  keys[h] = rem;
                  pos[h] = len;
                  rem *= 10;
                  if (len + 4 > cap) {
                      cap *= 2;
                      buf = (char*)realloc(buf, cap);
                  }
                  buf[len++] = (char)('0' + rem / den);
                  rem %= den;
              }
              buf[len] = '\0';
              free(keys);
              free(pos);
              return buf;
          }
        `,
        csharp: code`
          public static string FractionToDecimal(int numerator, int denominator)
          {
              if (numerator == 0) return "0";
              var sb = new System.Text.StringBuilder();
              if ((numerator < 0) != (denominator < 0)) sb.Append('-');
              long num = Math.Abs((long)numerator), den = Math.Abs((long)denominator);
              sb.Append(num / den);
              long rem = num % den;
              if (rem == 0) return sb.ToString();
              sb.Append('.');
              var seen = new Dictionary<long, int>();
              while (rem != 0)
              {
                  int at;
                  if (seen.TryGetValue(rem, out at))
                  {
                      sb.Insert(at, "(");
                      sb.Append(')');
                      break;
                  }
                  seen[rem] = sb.Length;
                  rem *= 10;
                  sb.Append((char)('0' + rem / den));
                  rem %= den;
              }
              return sb.ToString();
          }
        `,
        go: code`
          func fractionToDecimal(numerator int, denominator int) string {
              if numerator == 0 {
                  return "0"
              }
              res := []byte{}
              if (numerator < 0) != (denominator < 0) {
                  res = append(res, '-')
              }
              num, den := int64(numerator), int64(denominator)
              if num < 0 {
                  num = -num
              }
              if den < 0 {
                  den = -den
              }
              res = append(res, strconv.FormatInt(num/den, 10)...)
              rem := num % den
              if rem == 0 {
                  return string(res)
              }
              res = append(res, '.')
              seen := map[int64]int{}
              for rem != 0 {
                  if at, ok := seen[rem]; ok {
                      tail := append([]byte{'('}, res[at:]...)
                      res = append(res[:at], tail...)
                      res = append(res, ')')
                      break
                  }
                  seen[rem] = len(res)
                  rem *= 10
                  res = append(res, byte('0'+rem/den))
                  rem %= den
              }
              return string(res)
          }
        `,
        kotlin: code`
          fun fractionToDecimal(numerator: Int, denominator: Int): String {
              if (numerator == 0) return "0"
              val sb = StringBuilder()
              if ((numerator < 0) != (denominator < 0)) sb.append('-')
              val num = Math.abs(numerator.toLong())
              val den = Math.abs(denominator.toLong())
              sb.append(num / den)
              var rem = num % den
              if (rem == 0L) return sb.toString()
              sb.append('.')
              val seen = HashMap<Long, Int>()
              while (rem != 0L) {
                  val at = seen[rem]
                  if (at != null) {
                      sb.insert(at, "(")
                      sb.append(')')
                      break
                  }
                  seen[rem] = sb.length
                  rem *= 10
                  sb.append(rem / den)
                  rem %= den
              }
              return sb.toString()
          }
        `,
        swift: code`
          func fractionToDecimal(_ numerator: Int, _ denominator: Int) -> String {
              if numerator == 0 { return "0" }
              var res: [Character] = []
              if (numerator < 0) != (denominator < 0) { res.append("-") }
              let num = abs(numerator), den = abs(denominator)
              res.append(contentsOf: String(num / den))
              var rem = num % den
              if rem == 0 { return String(res) }
              res.append(".")
              var seen = [Int: Int]()
              while rem != 0 {
                  if let at = seen[rem] {
                      res.insert("(", at: at)
                      res.append(")")
                      break
                  }
                  seen[rem] = res.count
                  rem *= 10
                  res.append(Character(String(rem / den)))
                  rem %= den
              }
              return String(res)
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn fractionToDecimal(numerator: i32, denominator: i32) -> String {
              if numerator == 0 {
                  return "0".to_string();
              }
              let mut res = String::new();
              if (numerator < 0) != (denominator < 0) {
                  res.push('-');
              }
              let num = (numerator as i64).abs();
              let den = (denominator as i64).abs();
              res.push_str(&(num / den).to_string());
              let mut rem = num % den;
              if rem == 0 {
                  return res;
              }
              res.push('.');
              let mut seen: HashMap<i64, usize> = HashMap::new();
              while rem != 0 {
                  if let Some(&at) = seen.get(&rem) {
                      res.insert(at, '(');
                      res.push(')');
                      break;
                  }
                  seen.insert(rem, res.len());
                  rem *= 10;
                  res.push((b'0' + (rem / den) as u8) as char);
                  rem %= den;
              }
              res
          }
        `,
        php: code`
          function fractionToDecimal($numerator, $denominator) {
              if ($numerator == 0) return "0";
              $sign = (($numerator < 0) != ($denominator < 0)) ? "-" : "";
              $num = abs($numerator);
              $den = abs($denominator);
              $whole = intdiv($num, $den);
              $rem = $num % $den;
              if ($rem == 0) return $sign . $whole;
              $digits = [];
              $seen = [];
              while ($rem != 0) {
                  if (isset($seen[$rem])) {
                      $at = $seen[$rem];
                      return $sign . $whole . "." . implode("", array_slice($digits, 0, $at)) . "(" . implode("", array_slice($digits, $at)) . ")";
                  }
                  $seen[$rem] = count($digits);
                  $rem *= 10;
                  $digits[] = intdiv($rem, $den);
                  $rem %= $den;
              }
              return $sign . $whole . "." . implode("", $digits);
          }
        `,
        ruby: code`
          def fractionToDecimal(numerator, denominator)
            return "0" if numerator == 0
            sign = (numerator < 0) != (denominator < 0) ? "-" : ""
            num = numerator.abs
            den = denominator.abs
            whole = num / den
            rem = num % den
            return sign + whole.to_s if rem == 0
            digits = []
            seen = {}
            while rem != 0
              if seen.key?(rem)
                at = seen[rem]
                return sign + whole.to_s + "." + digits[0...at].join + "(" + digits[at..-1].join + ")"
              end
              seen[rem] = digits.length
              rem *= 10
              digits << (rem / den).to_s
              rem %= den
            end
            sign + whole.to_s + "." + digits.join
          end
        `,
      },
    };
  })(),

  // ── Different Ways to Add Parentheses (LC 241) ──────────────────
  (() => {
    const LIMIT = 2147483647;
    // All values of expression[lo..hi) — plain recursion, no memo.
    const all = (e: string, lo: number, hi: number, bad: { v: boolean }): number[] => {
      const out: number[] = [];
      for (let i = lo; i < hi; i++) {
        const c = e[i];
        if (c === "+" || c === "-" || c === "*") {
          const L = all(e, lo, i, bad), R = all(e, i + 1, hi, bad);
          for (const a of L) for (const b of R) {
            const v = c === "+" ? a + b : c === "-" ? a - b : a * b;
            if (Math.abs(v) > LIMIT) bad.v = true;
            out.push(v);
          }
        }
      }
      if (!out.length) out.push(parseInt(e.slice(lo, hi), 10));
      return out;
    };
    const ref = (e: string, bad: { v: boolean }) => all(e, 0, e.length, bad).sort((a, b) => a - b);
    return {
      slug: "different-ways-to-add-parentheses",
      title: "Different Ways to Add Parentheses",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Recursion", "Memoization", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "diffWaysToCompute", params: [{ name: "expression", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "`expression` is a string of non-negative integers joined by the operators `+`, `-` and `*`, with no spaces and no parentheses.\n\n" +
        "Consider **every** way to fully parenthesise the expression (every binary tree whose leaves are the numbers in order and whose internal nodes are the operators), and evaluate each one.\n\n" +
        "Return all the results **sorted in ascending order**. Different groupings that happen to give the same value are listed separately, so the list has one entry per grouping.",
        [
          { in: 'expression = "3*4-2"', out: "[6,10]", note: "`(3*4)-2 = 10` and `3*(4-2) = 6`." },
          { in: 'expression = "10-5-2"', out: "[3,7]" },
          { in: 'expression = "1+2*3-4"', out: "[-3,-1,3,3,5]", note: "Two different groupings both give 3." },
        ],
        [
          "1 <= expression.length <= 20",
          "expression consists of digits and the operators '+', '-' and '*'",
          "All the integer values in the input expression are in the range [0, 99] and have no leading zeros",
          "Every intermediate and final value fits in a 32-bit signed integer",
        ]),
      hints: [
        "Every full parenthesisation has a **last** operator applied — the root of the tree. Try each operator as the root.",
        "If the root is the operator at index `i`, the left side can be any value of `expression[..i)` and the right side any value of `expression(i..]`. Combine every pair.",
        "Recurse on the two sides; an expression with no operator is just a number. Cache results per substring (`lo`, `hi`) so shared sub-expressions are solved once, and sort at the end.",
      ],
      editorial: explain({
        idea: "Divide and conquer on the operator applied last: the results for a range are all combinations of the results for its left and right parts, for every operator that could be the root.",
        steps: [
          "Define `ways(lo, hi)` = list of values of `expression[lo..hi)` over all groupings.",
          "For each operator at index `i` in the range, combine every `a` in `ways(lo, i)` with every `b` in `ways(i + 1, hi)` using that operator, and append the result.",
          "If the range holds no operator, it is a number: return a list with just its value.",
          "Memoise `ways` on `(lo, hi)`, call `ways(0, n)` and sort the list.",
        ],
        why: "A full parenthesisation is a binary tree, and its root is exactly one of the operators; the subtrees are independent full parenthesisations of the left and right parts. So the multiset of values for the range is the union over root operators of the pairwise combinations — which is what the recursion builds, one entry per tree.",
        time: "O(C_k · k) results for k operators (C_k is the k-th Catalan number); the memo removes repeated sub-ranges",
        space: "O(C_k) for the output and memo",
        pitfalls: [
          "Numbers can have two digits — parse the whole number when a range has no operator.",
          "Do not deduplicate: two groupings with the same value both appear.",
          "Splitting on the first operator only, or evaluating left to right, misses most groupings.",
        ],
      }),
      examples: [
        { input: '"3*4-2"', expectedOutput: "[6,10]" },
        { input: '"10-5-2"', expectedOutput: "[3,7]" },
        { input: '"1+2*3-4"', expectedOutput: "[-3,-1,3,3,5]" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const ops = pick(rng, [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
          const opSet = pick(rng, ["+-*", "+-", "*-", "+*", "-", "*"]);
          let e = "";
          let multiplies = false;
          for (let i = 0; i <= ops; i++) {
            const small = opSet.includes("*");
            e += String(small ? ri(rng, 0, rng() < 0.5 ? 12 : 99) : ri(rng, 0, 99));
            if (i < ops) {
              const op = opSet[ri(rng, 0, opSet.length - 1)];
              if (op === "*") multiplies = true;
              e += op;
            }
          }
          if (e.length > 20) continue;
          const bad = { v: false };
          const out = ref(e, bad);
          if (bad.v || (multiplies && out.some((v) => Math.abs(v) > LIMIT))) continue;
          return { input: `"${e}"`, expectedOutput: fmtIntArr(out) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def diffWaysToCompute(expression: str) -> List[int]:
              memo = {}

              def ways(lo, hi):
                  key = lo * 64 + hi
                  if key in memo:
                      return memo[key]
                  out = []
                  for i in range(lo, hi):
                      c = expression[i]
                      if c in "+-*":
                          left = ways(lo, i)
                          right = ways(i + 1, hi)
                          for a in left:
                              for b in right:
                                  if c == "+":
                                      out.append(a + b)
                                  elif c == "-":
                                      out.append(a - b)
                                  else:
                                      out.append(a * b)
                  if not out:
                      out.append(int(expression[lo:hi]))
                  memo[key] = out
                  return out

              return sorted(ways(0, len(expression)))
        `,
        javascript: code`
          var diffWaysToCompute = function(expression) {
              var memo = new Map();
              var ways = function(lo, hi) {
                  var key = lo * 64 + hi;
                  if (memo.has(key)) return memo.get(key);
                  var out = [];
                  for (var i = lo; i < hi; i++) {
                      var c = expression[i];
                      if (c === "+" || c === "-" || c === "*") {
                          var left = ways(lo, i), right = ways(i + 1, hi);
                          for (var a = 0; a < left.length; a++) {
                              for (var b = 0; b < right.length; b++) {
                                  out.push(c === "+" ? left[a] + right[b] : c === "-" ? left[a] - right[b] : left[a] * right[b]);
                              }
                          }
                      }
                  }
                  if (out.length === 0) out.push(parseInt(expression.substring(lo, hi), 10));
                  memo.set(key, out);
                  return out;
              };
              return ways(0, expression.length).slice().sort(function(x, y) { return x - y; });
          };
        `,
        typescript: code`
          function diffWaysToCompute(expression: string): number[] {
              var memo: { [k: string]: number[] } = {};
              var ways = function(lo: number, hi: number): number[] {
                  var key = "k" + (lo * 64 + hi);
                  if (memo.hasOwnProperty(key)) return memo[key];
                  var out: number[] = [];
                  for (var i = lo; i < hi; i++) {
                      var c = expression.charAt(i);
                      if (c === "+" || c === "-" || c === "*") {
                          var left = ways(lo, i), right = ways(i + 1, hi);
                          for (var a = 0; a < left.length; a++) {
                              for (var b = 0; b < right.length; b++) {
                                  out.push(c === "+" ? left[a] + right[b] : c === "-" ? left[a] - right[b] : left[a] * right[b]);
                              }
                          }
                      }
                  }
                  if (out.length === 0) out.push(parseInt(expression.substring(lo, hi), 10));
                  memo[key] = out;
                  return out;
              };
              return ways(0, expression.length).slice().sort(function(x: number, y: number) { return x - y; });
          }
        `,
        java: code`
          static List<Integer> dwWays(String e, int lo, int hi, Map<Integer, List<Integer>> memo) {
              int key = lo * 64 + hi;
              List<Integer> hit = memo.get(key);
              if (hit != null) return hit;
              List<Integer> out = new ArrayList<>();
              for (int i = lo; i < hi; i++) {
                  char c = e.charAt(i);
                  if (c == '+' || c == '-' || c == '*') {
                      List<Integer> left = dwWays(e, lo, i, memo), right = dwWays(e, i + 1, hi, memo);
                      for (int a : left) {
                          for (int b : right) out.add(c == '+' ? a + b : c == '-' ? a - b : a * b);
                      }
                  }
              }
              if (out.isEmpty()) out.add(Integer.parseInt(e.substring(lo, hi)));
              memo.put(key, out);
              return out;
          }

          public static int[] diffWaysToCompute(String expression) {
              List<Integer> all = dwWays(expression, 0, expression.length(), new HashMap<>());
              int[] res = new int[all.size()];
              for (int i = 0; i < res.length; i++) res[i] = all.get(i);
              Arrays.sort(res);
              return res;
          }
        `,
        cpp: code`
          static vector<int> dwWays(const string& e, int lo, int hi, map<int, vector<int>>& memo) {
              int key = lo * 64 + hi;
              auto it = memo.find(key);
              if (it != memo.end()) return it->second;
              vector<int> out;
              for (int i = lo; i < hi; i++) {
                  char c = e[i];
                  if (c == '+' || c == '-' || c == '*') {
                      vector<int> left = dwWays(e, lo, i, memo), right = dwWays(e, i + 1, hi, memo);
                      for (int a : left) {
                          for (int b : right) out.push_back(c == '+' ? a + b : c == '-' ? a - b : a * b);
                      }
                  }
              }
              if (out.empty()) out.push_back(stoi(e.substr(lo, hi - lo)));
              memo[key] = out;
              return out;
          }

          vector<int> diffWaysToCompute(string expression) {
              map<int, vector<int>> memo;
              vector<int> res = dwWays(expression, 0, expression.size(), memo);
              sort(res.begin(), res.end());
              return res;
          }
        `,
        c: code`
          static int* dwWays(const char* e, int lo, int hi, int* outSize) {
              int cap = 4, cnt = 0;
              int* res = (int*)malloc(sizeof(int) * cap);
              for (int i = lo; i < hi; i++) {
                  char c = e[i];
                  if (c == '+' || c == '-' || c == '*') {
                      int ls, rs;
                      int* left = dwWays(e, lo, i, &ls);
                      int* right = dwWays(e, i + 1, hi, &rs);
                      for (int a = 0; a < ls; a++) {
                          for (int b = 0; b < rs; b++) {
                              if (cnt == cap) {
                                  cap *= 2;
                                  res = (int*)realloc(res, sizeof(int) * cap);
                              }
                              res[cnt++] = c == '+' ? left[a] + right[b] : c == '-' ? left[a] - right[b] : left[a] * right[b];
                          }
                      }
                      free(left);
                      free(right);
                  }
              }
              if (cnt == 0) {
                  int v = 0;
                  for (int i = lo; i < hi; i++) v = v * 10 + (e[i] - '0');
                  res[cnt++] = v;
              }
              *outSize = cnt;
              return res;
          }

          static int dwCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int* diffWaysToCompute(const char* expression, int* returnSize) {
              int n;
              int* res = dwWays(expression, 0, (int)strlen(expression), &n);
              qsort(res, n, sizeof(int), dwCmp);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          static List<int> DwWays(string e, int lo, int hi, Dictionary<int, List<int>> memo)
          {
              int key = lo * 64 + hi;
              List<int> hit;
              if (memo.TryGetValue(key, out hit)) return hit;
              var res = new List<int>();
              for (int i = lo; i < hi; i++)
              {
                  char c = e[i];
                  if (c == '+' || c == '-' || c == '*')
                  {
                      var left = DwWays(e, lo, i, memo);
                      var right = DwWays(e, i + 1, hi, memo);
                      foreach (int a in left)
                      {
                          foreach (int b in right) res.Add(c == '+' ? a + b : c == '-' ? a - b : a * b);
                      }
                  }
              }
              if (res.Count == 0) res.Add(int.Parse(e.Substring(lo, hi - lo)));
              memo[key] = res;
              return res;
          }

          public static int[] DiffWaysToCompute(string expression)
          {
              var all = DwWays(expression, 0, expression.Length, new Dictionary<int, List<int>>()).ToArray();
              Array.Sort(all);
              return all;
          }
        `,
        go: code`
          func dwWays(e string, lo, hi int, memo map[int][]int) []int {
              key := lo*64 + hi
              if hit, ok := memo[key]; ok {
                  return hit
              }
              out := []int{}
              for i := lo; i < hi; i++ {
                  c := e[i]
                  if c == '+' || c == '-' || c == '*' {
                      left := dwWays(e, lo, i, memo)
                      right := dwWays(e, i+1, hi, memo)
                      for _, a := range left {
                          for _, b := range right {
                              if c == '+' {
                                  out = append(out, a+b)
                              } else if c == '-' {
                                  out = append(out, a-b)
                              } else {
                                  out = append(out, a*b)
                              }
                          }
                      }
                  }
              }
              if len(out) == 0 {
                  v := 0
                  for i := lo; i < hi; i++ {
                      v = v*10 + int(e[i]-'0')
                  }
                  out = append(out, v)
              }
              memo[key] = out
              return out
          }

          func diffWaysToCompute(expression string) []int {
              all := dwWays(expression, 0, len(expression), map[int][]int{})
              res := make([]int, len(all))
              copy(res, all)
              sort.Ints(res)
              return res
          }
        `,
        kotlin: code`
          fun dwWays(e: String, lo: Int, hi: Int, memo: HashMap<Int, List<Int>>): List<Int> {
              val key = lo * 64 + hi
              val hit = memo[key]
              if (hit != null) return hit
              val out = ArrayList<Int>()
              for (i in lo until hi) {
                  val c = e[i]
                  if (c == '+' || c == '-' || c == '*') {
                      val left = dwWays(e, lo, i, memo)
                      val right = dwWays(e, i + 1, hi, memo)
                      for (a in left) {
                          for (b in right) out.add(if (c == '+') a + b else if (c == '-') a - b else a * b)
                      }
                  }
              }
              if (out.isEmpty()) out.add(e.substring(lo, hi).toInt())
              memo[key] = out
              return out
          }

          fun diffWaysToCompute(expression: String): IntArray {
              val res = dwWays(expression, 0, expression.length, HashMap()).toIntArray()
              res.sort()
              return res
          }
        `,
        swift: code`
          func dwWays(_ e: [UInt8], _ lo: Int, _ hi: Int, _ memo: inout [Int: [Int]]) -> [Int] {
              let key = lo * 64 + hi
              if let hit = memo[key] { return hit }
              var out: [Int] = []
              for i in lo..<hi {
                  let c = e[i]
                  if c == 43 || c == 45 || c == 42 {
                      let left = dwWays(e, lo, i, &memo)
                      let right = dwWays(e, i + 1, hi, &memo)
                      for a in left {
                          for b in right {
                              out.append(c == 43 ? a + b : c == 45 ? a - b : a * b)
                          }
                      }
                  }
              }
              if out.isEmpty {
                  var v = 0
                  for i in lo..<hi { v = v * 10 + Int(e[i]) - 48 }
                  out.append(v)
              }
              memo[key] = out
              return out
          }

          func diffWaysToCompute(_ expression: String) -> [Int] {
              var memo = [Int: [Int]]()
              return dwWays(Array(expression.utf8), 0, expression.utf8.count, &memo).sorted()
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn dw_ways(e: &[u8], lo: usize, hi: usize, memo: &mut HashMap<usize, Vec<i32>>) -> Vec<i32> {
              let key = lo * 64 + hi;
              if let Some(hit) = memo.get(&key) {
                  return hit.clone();
              }
              let mut out: Vec<i32> = Vec::new();
              for i in lo..hi {
                  let c = e[i];
                  if c == b'+' || c == b'-' || c == b'*' {
                      let left = dw_ways(e, lo, i, memo);
                      let right = dw_ways(e, i + 1, hi, memo);
                      for &a in left.iter() {
                          for &b in right.iter() {
                              out.push(if c == b'+' { a + b } else if c == b'-' { a - b } else { a * b });
                          }
                      }
                  }
              }
              if out.is_empty() {
                  let mut v = 0i32;
                  for i in lo..hi {
                      v = v * 10 + (e[i] - b'0') as i32;
                  }
                  out.push(v);
              }
              memo.insert(key, out.clone());
              out
          }

          fn diffWaysToCompute(expression: String) -> Vec<i32> {
              let mut memo: HashMap<usize, Vec<i32>> = HashMap::new();
              let mut res = dw_ways(expression.as_bytes(), 0, expression.len(), &mut memo);
              res.sort();
              res
          }
        `,
        php: code`
          function dwWays($e, $lo, $hi, &$memo) {
              $key = $lo * 64 + $hi;
              if (isset($memo[$key])) return $memo[$key];
              $out = [];
              for ($i = $lo; $i < $hi; $i++) {
                  $c = $e[$i];
                  if ($c === "+" || $c === "-" || $c === "*") {
                      $left = dwWays($e, $lo, $i, $memo);
                      $right = dwWays($e, $i + 1, $hi, $memo);
                      foreach ($left as $a) {
                          foreach ($right as $b) {
                              if ($c === "+") $out[] = $a + $b;
                              elseif ($c === "-") $out[] = $a - $b;
                              else $out[] = $a * $b;
                          }
                      }
                  }
              }
              if (count($out) == 0) $out[] = intval(substr($e, $lo, $hi - $lo));
              $memo[$key] = $out;
              return $out;
          }

          function diffWaysToCompute($expression) {
              $memo = [];
              $res = dwWays($expression, 0, strlen($expression), $memo);
              sort($res);
              return $res;
          }
        `,
        ruby: code`
          def dw_ways(e, lo, hi, memo)
            key = lo * 64 + hi
            return memo[key] if memo.key?(key)
            out = []
            (lo...hi).each do |i|
              c = e[i]
              next unless c == "+" || c == "-" || c == "*"
              left = dw_ways(e, lo, i, memo)
              right = dw_ways(e, i + 1, hi, memo)
              left.each do |a|
                right.each do |b|
                  out << (c == "+" ? a + b : c == "-" ? a - b : a * b)
                end
              end
            end
            out << e[lo...hi].to_i if out.empty?
            memo[key] = out
            out
          end

          def diffWaysToCompute(expression)
            dw_ways(expression, 0, expression.length, {}).sort
          end
        `,
      },
    };
  })(),

  // ── Palindrome Partitioning IV (LC 1745) ────────────────────────
  (() => {
    const isPal = (s: string, i: number, j: number) => {
      while (i < j) { if (s[i] !== s[j]) return false; i++; j--; }
      return true;
    };
    const ref = (s: string): boolean => {
      const n = s.length;
      for (let i = 1; i < n - 1; i++) {
        if (!isPal(s, 0, i - 1)) continue;
        for (let j = i; j < n - 1; j++) if (isPal(s, i, j) && isPal(s, j + 1, n - 1)) return true;
      }
      return false;
    };
    const palindrome = (rng: Rng, alpha: string) => {
      const half = randLower(rng, 0, 4, alpha);
      const mid = rng() < 0.5 ? randLower(rng, 1, 1, alpha) : "";
      const p = half + mid + half.split("").reverse().join("");
      return p || alpha[0];
    };
    return {
      slug: "palindrome-partitioning-iv",
      title: "Palindrome Partitioning IV",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "checkPartitioning", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Return `true` if the string `s` can be split into **exactly three non-empty** substrings, each of which is a **palindrome** (reads the same forwards and backwards). Otherwise return `false`.",
        [
          { in: 's = "kayakmomx"', out: "true", note: "`kayak` + `mom` + `x`." },
          { in: 's = "abcde"', out: "false" },
          { in: 's = "aaa"', out: "true", note: "`a` + `a` + `a`." },
        ],
        ["3 <= s.length <= 2000", "s consists only of lowercase English letters"]),
      hints: [
        "There are only `O(n^2)` ways to choose the two cut points. The problem is checking three palindromes per choice fast.",
        "Precompute `pal[i][j]` — whether `s[i..j]` is a palindrome — with `pal[i][j] = s[i] == s[j] && (j - i < 2 || pal[i+1][j-1])`, filling `i` from right to left.",
        "Then try every first cut `i` (with `s[0..i-1]` a palindrome) and second cut `j`, and check `pal[i][j]` and `pal[j+1][n-1]` in `O(1)`.",
      ],
      editorial: explain({
        idea: "A table of which substrings are palindromes turns every candidate split into three `O(1)` lookups, and there are only `O(n^2)` splits.",
        steps: [
          "Fill `pal[i][j]` for `i` from `n - 1` down to 0 and `j` from `i` up: `pal[i][j]` is true when `s[i] == s[j]` and either `j - i < 2` or `pal[i+1][j-1]`.",
          "For every `i` in `1..n-2` with `pal[0][i-1]` true, and every `j` in `i..n-2`: if `pal[i][j]` and `pal[j+1][n-1]`, return `true`.",
          "Return `false`.",
        ],
        why: "A substring is a palindrome exactly when its end characters match and its interior is a palindrome (or it is too short to have one), which is the recurrence; filling `i` downwards ensures `pal[i+1][j-1]` is ready. The double loop enumerates every way to cut `s` into three non-empty parts, so the answer is found if it exists.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "All three parts must be non-empty: the first cut is at least 1 and the second leaves at least one character.",
          "Checking each candidate part directly costs `O(n)` per split — `O(n^3)` overall.",
          "Fill order matters: `pal[i][j]` depends on row `i + 1`.",
        ],
      }),
      examples: [
        { input: '"kayakmomx"', expectedOutput: "true" },
        { input: '"abcde"', expectedOutput: "false" },
        { input: '"aaa"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        let s: string;
        if (rng() < 0.45) {
          s = palindrome(rng, alpha) + palindrome(rng, alpha) + palindrome(rng, alpha);
          if (rng() < 0.4) {
            const at = ri(rng, 0, s.length - 1);
            s = s.slice(0, at) + alpha[ri(rng, 0, alpha.length - 1)] + s.slice(at + 1);
          }
        } else s = randLower(rng, 3, 20, alpha);
        if (s.length < 3) s = s + "abc".slice(0, 3 - s.length);
        s = s.slice(0, 30);
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def checkPartitioning(s: str) -> bool:
              n = len(s)
              pal = [[False] * n for _ in range(n)]
              for i in range(n - 1, -1, -1):
                  row, inner = pal[i], pal[i + 1] if i + 1 < n else None
                  for j in range(i, n):
                      if s[i] == s[j] and (j - i < 2 or inner[j - 1]):
                          row[j] = True
              for i in range(1, n - 1):
                  if not pal[0][i - 1]:
                      continue
                  for j in range(i, n - 1):
                      if pal[i][j] and pal[j + 1][n - 1]:
                          return True
              return False
        `,
        javascript: code`
          var checkPartitioning = function(s) {
              var n = s.length;
              var pal = [];
              for (var r = 0; r < n; r++) pal.push(new Uint8Array(n));
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = i; j < n; j++) {
                      if (s[i] === s[j] && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = 1;
                  }
              }
              for (var a = 1; a < n - 1; a++) {
                  if (!pal[0][a - 1]) continue;
                  for (var b = a; b < n - 1; b++) {
                      if (pal[a][b] && pal[b + 1][n - 1]) return true;
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function checkPartitioning(s: string): boolean {
              var n = s.length;
              var pal: boolean[][] = [];
              for (var r = 0; r < n; r++) {
                  var row: boolean[] = [];
                  for (var z = 0; z < n; z++) row.push(false);
                  pal.push(row);
              }
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = i; j < n; j++) {
                      if (s.charAt(i) === s.charAt(j) && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = true;
                  }
              }
              for (var a = 1; a < n - 1; a++) {
                  if (!pal[0][a - 1]) continue;
                  for (var b = a; b < n - 1; b++) {
                      if (pal[a][b] && pal[b + 1][n - 1]) return true;
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean checkPartitioning(String s) {
              int n = s.length();
              boolean[][] pal = new boolean[n][n];
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = i; j < n; j++) {
                      if (s.charAt(i) == s.charAt(j) && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = true;
                  }
              }
              for (int a = 1; a < n - 1; a++) {
                  if (!pal[0][a - 1]) continue;
                  for (int b = a; b < n - 1; b++) {
                      if (pal[a][b] && pal[b + 1][n - 1]) return true;
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool checkPartitioning(string s) {
              int n = s.size();
              vector<vector<char>> pal(n, vector<char>(n, 0));
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = i; j < n; j++) {
                      if (s[i] == s[j] && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = 1;
                  }
              }
              for (int a = 1; a < n - 1; a++) {
                  if (!pal[0][a - 1]) continue;
                  for (int b = a; b < n - 1; b++) {
                      if (pal[a][b] && pal[b + 1][n - 1]) return true;
                  }
              }
              return false;
          }
        `,
        c: code`
          bool checkPartitioning(const char* s) {
              int n = (int)strlen(s);
              char* pal = (char*)calloc((size_t)n * n, 1);
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = i; j < n; j++) {
                      if (s[i] == s[j] && (j - i < 2 || pal[(i + 1) * n + j - 1])) pal[i * n + j] = 1;
                  }
              }
              bool found = false;
              for (int a = 1; a < n - 1 && !found; a++) {
                  if (!pal[a - 1]) continue;
                  for (int b = a; b < n - 1; b++) {
                      if (pal[a * n + b] && pal[(b + 1) * n + n - 1]) {
                          found = true;
                          break;
                      }
                  }
              }
              free(pal);
              return found;
          }
        `,
        csharp: code`
          public static bool CheckPartitioning(string s)
          {
              int n = s.Length;
              var pal = new bool[n, n];
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int j = i; j < n; j++)
                  {
                      if (s[i] == s[j] && (j - i < 2 || pal[i + 1, j - 1])) pal[i, j] = true;
                  }
              }
              for (int a = 1; a < n - 1; a++)
              {
                  if (!pal[0, a - 1]) continue;
                  for (int b = a; b < n - 1; b++)
                  {
                      if (pal[a, b] && pal[b + 1, n - 1]) return true;
                  }
              }
              return false;
          }
        `,
        go: code`
          func checkPartitioning(s string) bool {
              n := len(s)
              pal := make([][]bool, n)
              for i := range pal {
                  pal[i] = make([]bool, n)
              }
              for i := n - 1; i >= 0; i-- {
                  for j := i; j < n; j++ {
                      if s[i] == s[j] && (j-i < 2 || pal[i+1][j-1]) {
                          pal[i][j] = true
                      }
                  }
              }
              for a := 1; a < n-1; a++ {
                  if !pal[0][a-1] {
                      continue
                  }
                  for b := a; b < n-1; b++ {
                      if pal[a][b] && pal[b+1][n-1] {
                          return true
                      }
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun checkPartitioning(s: String): Boolean {
              val n = s.length
              val pal = Array(n) { BooleanArray(n) }
              for (i in n - 1 downTo 0) {
                  for (j in i until n) {
                      if (s[i] == s[j] && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = true
                  }
              }
              for (a in 1 until n - 1) {
                  if (!pal[0][a - 1]) continue
                  for (b in a until n - 1) {
                      if (pal[a][b] && pal[b + 1][n - 1]) return true
                  }
              }
              return false
          }
        `,
        swift: code`
          func checkPartitioning(_ s: String) -> Bool {
              let c = Array(s.utf8)
              let n = c.count
              var pal = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)
              var i = n - 1
              while i >= 0 {
                  for j in i..<n {
                      if c[i] == c[j] && (j - i < 2 || pal[i + 1][j - 1]) { pal[i][j] = true }
                  }
                  i -= 1
              }
              if n < 3 { return false }
              for a in 1..<(n - 1) {
                  if !pal[0][a - 1] { continue }
                  for b in a..<(n - 1) {
                      if pal[a][b] && pal[b + 1][n - 1] { return true }
                  }
              }
              return false
          }
        `,
        rust: code`
          fn checkPartitioning(s: String) -> bool {
              let c = s.as_bytes();
              let n = c.len();
              let mut pal = vec![vec![false; n]; n];
              for i in (0..n).rev() {
                  for j in i..n {
                      if c[i] == c[j] && (j - i < 2 || pal[i + 1][j - 1]) {
                          pal[i][j] = true;
                      }
                  }
              }
              if n < 3 {
                  return false;
              }
              for a in 1..n - 1 {
                  if !pal[0][a - 1] {
                      continue;
                  }
                  for b in a..n - 1 {
                      if pal[a][b] && pal[b + 1][n - 1] {
                          return true;
                      }
                  }
              }
              false
          }
        `,
        php: code`
          function checkPartitioning($s) {
              $n = strlen($s);
              $pal = array_fill(0, $n, array_fill(0, $n, false));
              for ($i = $n - 1; $i >= 0; $i--) {
                  for ($j = $i; $j < $n; $j++) {
                      if ($s[$i] === $s[$j] && ($j - $i < 2 || $pal[$i + 1][$j - 1])) $pal[$i][$j] = true;
                  }
              }
              for ($a = 1; $a < $n - 1; $a++) {
                  if (!$pal[0][$a - 1]) continue;
                  for ($b = $a; $b < $n - 1; $b++) {
                      if ($pal[$a][$b] && $pal[$b + 1][$n - 1]) return true;
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def checkPartitioning(s)
            c = s.bytes
            n = c.length
            pal = Array.new(n) { Array.new(n, false) }
            (n - 1).downto(0) do |i|
              (i...n).each do |j|
                pal[i][j] = true if c[i] == c[j] && (j - i < 2 || pal[i + 1][j - 1])
              end
            end
            (1...(n - 1)).each do |a|
              next unless pal[0][a - 1]
              (a...(n - 1)).each do |b|
                return true if pal[a][b] && pal[b + 1][n - 1]
              end
            end
            false
          end
        `,
      },
    };
  })(),

];
