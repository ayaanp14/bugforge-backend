/**
 * String problems II — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h, limits.h or
 * ctype.h, so character classes are tested by hand.
 *
 * Zigzag Conversion's entry point is `zigzagConvert`, not LeetCode's `convert`:
 * the C# driver lives in one class with the solution and calls
 * `Convert.FromBase64String`, which a method named `Convert` would shadow.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const STRINGS7_PROBLEMS: CatalogProblem[] = [

  // ── Zigzag Conversion (LC 6) ────────────────────────────────────
  (() => {
    const ref = (s: string, numRows: number) => {
      if (numRows === 1) return s;
      const rows: string[] = [];
      for (let i = 0; i < numRows; i++) rows.push("");
      let r = 0, d = 1;
      for (let i = 0; i < s.length; i++) {
        rows[r] += s[i];
        if (r === 0) d = 1;
        else if (r === numRows - 1) d = -1;
        r += d;
      }
      return rows.join("");
    };
    return {
      slug: "zigzag-conversion",
      title: "Zigzag Conversion",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Simulation", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "zigzagConvert", params: [{ name: "s", type: "string" as const }, { name: "numRows", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Lay the characters of `s` out on `numRows` rows in a zigzag: the first character goes on row 0, then each next character goes one row lower until the bottom row is reached, then one row higher (moving one column right each step) until row 0 is reached again, and so on.\n\nFor `s = \"CODEKAIRO.ROCKS\"` and `numRows = 3` the layout is:\n\n```\nC   K   O   C\nO E A R . O K\nD   I   R   S\n```\n\nReturn the string obtained by reading the rows top to bottom, each row left to right. With a single row the text is unchanged.",
        [
          { in: "s = \"CODEKAIRO.ROCKS\", numRows = 3", out: '"CKOCOEAR.OKDIRS"', note: "Rows read `CKOC`, `OEAR.OK` and `DIRS`." },
          { in: "s = \"ZigZag,Fun\", numRows = 4", out: '"Z,igFgauZn"' },
          { in: "s = \"A\", numRows = 1", out: '"A"' },
        ],
        ["1 <= s.length <= 1000", "s consists of English letters, ',' and '.'", "1 <= numRows <= 1000"]),
      hints: [
        "You do not need a 2-D grid: only the order of characters within each row matters.",
        "The pattern repeats every `2 * numRows - 2` characters (one trip down and back up).",
        "Row `r` takes index `j` for `j = r, r + cycle, …`, and every middle row also takes `j + cycle - 2r` from the upward stroke.",
      ],
      editorial: explain({
        idea: "The zigzag is periodic with period `cycle = 2·numRows − 2`, so every row can be read straight from `s` by index arithmetic instead of drawing the picture.",
        steps: [
          "If `numRows` is 1 or at least `s.length`, return `s` unchanged — no character ever moves.",
          "Set `cycle = 2·numRows − 2`.",
          "For each row `r` from 0 to `numRows − 1`, walk `j = r, r + cycle, r + 2·cycle, …` while `j < n` and append `s[j]`.",
          "For a middle row (`0 < r < numRows − 1`), after `s[j]` also append `s[j + cycle − 2r]` when that index exists — it is the character the upward diagonal drops on row `r` within the same period.",
        ],
        why: "Within one period the column goes down through rows 0…numRows−1 (offsets 0…numRows−1) and back up through rows numRows−2…1 (offsets numRows…cycle−1). Row `r` therefore receives offset `r` on the way down and offset `cycle − r` on the way up, and the two coincide only for the top and bottom rows. Reading periods in order, and within a period the down offset before the up one, gives each row's characters left to right.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "`numRows = 1` makes the cycle 0 — handle it first or the loop never advances.",
          "Top and bottom rows get one character per period, not two; adding the up-stroke there duplicates characters.",
          "Building an actual `numRows × n` grid works but wastes memory when `numRows` is large.",
        ],
      }),
      examples: [
        { input: '"CODEKAIRO.ROCKS"\n3', expectedOutput: "CKOCOEAR.OKDIRS" },
        { input: '"ZigZag,Fun"\n4', expectedOutput: "Z,igFgauZn" },
        { input: '"A"\n1', expectedOutput: "A" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, [LETTERS, "abc", "AaBb,.", LETTERS + ",."]);
        const len = pick(rng, [ri(rng, 1, 3), ri(rng, 4, 20), ri(rng, 4, 20), ri(rng, 21, 60)]);
        const s = randLower(rng, len, len, alpha);
        const numRows = pick(rng, [1, 2, ri(rng, 3, 6), ri(rng, 1, len + 2), len, 1000]);
        return { input: `"${s}"\n${numRows}`, expectedOutput: ref(s, numRows) };
      },
      solutions: {
        python: code`
          def zigzagConvert(s: str, numRows: int) -> str:
              n = len(s)
              if numRows == 1 or numRows >= n:
                  return s
              cycle = 2 * numRows - 2
              out = []
              for r in range(numRows):
                  j = r
                  while j < n:
                      out.append(s[j])
                      k = j + cycle - 2 * r
                      if 0 < r < numRows - 1 and k < n:
                          out.append(s[k])
                      j += cycle
              return "".join(out)
        `,
        javascript: code`
          var zigzagConvert = function(s, numRows) {
              var n = s.length;
              if (numRows === 1 || numRows >= n) return s;
              var cycle = 2 * numRows - 2;
              var out = [];
              for (var r = 0; r < numRows; r++) {
                  for (var j = r; j < n; j += cycle) {
                      out.push(s[j]);
                      var k = j + cycle - 2 * r;
                      if (r > 0 && r < numRows - 1 && k < n) out.push(s[k]);
                  }
              }
              return out.join("");
          };
        `,
        typescript: code`
          function zigzagConvert(s: string, numRows: number): string {
              var n = s.length;
              if (numRows === 1 || numRows >= n) return s;
              var cycle = 2 * numRows - 2;
              var out: string[] = [];
              for (var r = 0; r < numRows; r++) {
                  for (var j = r; j < n; j += cycle) {
                      out.push(s.charAt(j));
                      var k = j + cycle - 2 * r;
                      if (r > 0 && r < numRows - 1 && k < n) out.push(s.charAt(k));
                  }
              }
              return out.join("");
          }
        `,
        java: code`
          public static String zigzagConvert(String s, int numRows) {
              int n = s.length();
              if (numRows == 1 || numRows >= n) return s;
              int cycle = 2 * numRows - 2;
              StringBuilder sb = new StringBuilder();
              for (int r = 0; r < numRows; r++) {
                  for (int j = r; j < n; j += cycle) {
                      sb.append(s.charAt(j));
                      int k = j + cycle - 2 * r;
                      if (r > 0 && r < numRows - 1 && k < n) sb.append(s.charAt(k));
                  }
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string zigzagConvert(string s, int numRows) {
              int n = (int)s.size();
              if (numRows == 1 || numRows >= n) return s;
              int cycle = 2 * numRows - 2;
              string out;
              for (int r = 0; r < numRows; r++) {
                  for (int j = r; j < n; j += cycle) {
                      out.push_back(s[j]);
                      int k = j + cycle - 2 * r;
                      if (r > 0 && r < numRows - 1 && k < n) out.push_back(s[k]);
                  }
              }
              return out;
          }
        `,
        c: code`
          char* zigzagConvert(const char* s, int numRows) {
              int n = (int)strlen(s);
              char* out = (char*)malloc(n + 1);
              if (numRows == 1 || numRows >= n) {
                  memcpy(out, s, n + 1);
                  return out;
              }
              int cycle = 2 * numRows - 2, p = 0;
              for (int r = 0; r < numRows; r++) {
                  for (int j = r; j < n; j += cycle) {
                      out[p++] = s[j];
                      int k = j + cycle - 2 * r;
                      if (r > 0 && r < numRows - 1 && k < n) out[p++] = s[k];
                  }
              }
              out[p] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string ZigzagConvert(string s, int numRows)
          {
              int n = s.Length;
              if (numRows == 1 || numRows >= n) return s;
              int cycle = 2 * numRows - 2;
              var sb = new System.Text.StringBuilder();
              for (int r = 0; r < numRows; r++)
              {
                  for (int j = r; j < n; j += cycle)
                  {
                      sb.Append(s[j]);
                      int k = j + cycle - 2 * r;
                      if (r > 0 && r < numRows - 1 && k < n) sb.Append(s[k]);
                  }
              }
              return sb.ToString();
          }
        `,
        go: code`
          func zigzagConvert(s string, numRows int) string {
          	n := len(s)
          	if numRows == 1 || numRows >= n {
          		return s
          	}
          	cycle := 2*numRows - 2
          	out := make([]byte, 0, n)
          	for r := 0; r < numRows; r++ {
          		for j := r; j < n; j += cycle {
          			out = append(out, s[j])
          			k := j + cycle - 2*r
          			if r > 0 && r < numRows-1 && k < n {
          				out = append(out, s[k])
          			}
          		}
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun zigzagConvert(s: String, numRows: Int): String {
              val n = s.length
              if (numRows == 1 || numRows >= n) return s
              val cycle = 2 * numRows - 2
              val sb = StringBuilder()
              for (r in 0 until numRows) {
                  var j = r
                  while (j < n) {
                      sb.append(s[j])
                      val k = j + cycle - 2 * r
                      if (r > 0 && r < numRows - 1 && k < n) sb.append(s[k])
                      j += cycle
                  }
              }
              return sb.toString()
          }
        `,
        swift: code`
          func zigzagConvert(_ s: String, _ numRows: Int) -> String {
              let chars = Array(s)
              let n = chars.count
              if numRows == 1 || numRows >= n { return s }
              let cycle = 2 * numRows - 2
              var out = [Character]()
              for r in 0..<numRows {
                  var j = r
                  while j < n {
                      out.append(chars[j])
                      let k = j + cycle - 2 * r
                      if r > 0 && r < numRows - 1 && k < n { out.append(chars[k]) }
                      j += cycle
                  }
              }
              return String(out)
          }
        `,
        rust: code`
          fn zigzagConvert(s: String, numRows: i32) -> String {
              let n = s.len();
              let rows = numRows as usize;
              if rows == 1 || rows >= n {
                  return s;
              }
              let b = s.as_bytes();
              let cycle = 2 * rows - 2;
              let mut out: Vec<u8> = Vec::with_capacity(n);
              for r in 0..rows {
                  let mut j = r;
                  while j < n {
                      out.push(b[j]);
                      let k = j + cycle - 2 * r;
                      if r > 0 && r < rows - 1 && k < n {
                          out.push(b[k]);
                      }
                      j += cycle;
                  }
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function zigzagConvert($s, $numRows) {
              $n = strlen($s);
              if ($numRows == 1 || $numRows >= $n) return $s;
              $cycle = 2 * $numRows - 2;
              $out = "";
              for ($r = 0; $r < $numRows; $r++) {
                  for ($j = $r; $j < $n; $j += $cycle) {
                      $out .= $s[$j];
                      $k = $j + $cycle - 2 * $r;
                      if ($r > 0 && $r < $numRows - 1 && $k < $n) $out .= $s[$k];
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def zigzagConvert(s, numRows)
            n = s.length
            return s if numRows == 1 || numRows >= n
            cycle = 2 * numRows - 2
            out = []
            (0...numRows).each do |r|
              j = r
              while j < n
                out << s[j]
                k = j + cycle - 2 * r
                out << s[k] if r > 0 && r < numRows - 1 && k < n
                j += cycle
              end
            end
            out.join
          end
        `,
      },
    };
  })(),

  // ── Restore IP Addresses (LC 93) ────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const ok = (t: string) => t.length >= 1 && t.length <= 3 && (t === "0" || t[0] !== "0") && Number(t) <= 255;
      const out: string[] = [];
      for (let a = 1; a <= 3; a++) for (let b = 1; b <= 3; b++) for (let c = 1; c <= 3; c++) {
        const d = s.length - a - b - c;
        if (d < 1 || d > 3) continue;
        const parts = [s.slice(0, a), s.slice(a, a + b), s.slice(a + b, a + b + c), s.slice(a + b + c)];
        if (parts.every(ok)) out.push(parts.join("."));
      }
      return out.sort();
    };
    return {
      slug: "restore-ip-addresses",
      title: "Restore IP Addresses",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Amazon", "Microsoft", "Oracle"],
      signature: { funcName: "restoreIpAddresses", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "An IPv4 address is four integers between `0` and `255` joined by dots, where no part has a leading zero: `10.0.1.255` is valid, while `10.01.1.2`, `256.1.1.1` and `1.2.3` are not.\n\nYou are given a string `s` of digits. Insert exactly three dots into `s` — without removing, reordering or adding any digit — and return every valid IPv4 address that can be formed.\n\nReturn the addresses sorted in ascending lexicographic order (plain character comparison, where `.` comes before every digit). Return an empty list if none can be formed.",
        [
          { in: "s = \"10203\"", out: "[\"1.0.20.3\",\"10.2.0.3\"]", note: "`10.20.3` needs a fourth part, and `1.02.0.3` has a leading zero." },
          { in: "s = \"0000\"", out: "[\"0.0.0.0\"]" },
          { in: "s = \"1111111111111\"", out: "[]", note: "Thirteen digits cannot fit into four parts of at most three digits." },
        ],
        ["1 <= s.length <= 20", "s consists of digits only"]),
      hints: [
        "Every part has length 1, 2 or 3, so there are at most 3^3 ways to place the dots.",
        "A part is valid when it is `\"0\"` or starts with a non-zero digit, and its value is at most 255.",
        "Backtrack over the part lengths, pruning when the remaining digits cannot fill the remaining parts (fewer than one or more than three each).",
      ],
      editorial: explain({
        idea: "Choose the four part lengths by backtracking; each choice is checked locally (no leading zero, value ≤ 255), and the remaining length bounds prune hopeless branches early.",
        steps: [
          "Recurse with the index `start` of the next unread digit and the parts chosen so far.",
          "When four parts are chosen, record `parts.join(\".\")` if `start` reached the end of `s`.",
          "Otherwise, with `left` parts still to place and `rem` digits unread, stop if `rem < left` or `rem > 3·left`.",
          "Try lengths 1, 2, 3 in that order: stop extending once the part would start with `0` and be longer than one digit, or once its value exceeds 255 — both conditions only get worse with more digits.",
          "Trying shorter parts first emits the addresses already in lexicographic order.",
        ],
        why: "Every address corresponds to exactly one choice of four lengths, and the search tries all choices that are not ruled out by a condition that would also rule out every extension, so nothing valid is missed and nothing is produced twice. The order is lexicographic because two addresses from the same digits first differ where one has a dot and the other a digit — the one with the shorter part there has the dot, and `.` sorts before digits; the search tries that shorter part first.",
        time: "O(3^4 · n) — at most 81 leaves, each joined in O(n)",
        space: "O(n) besides the output",
        pitfalls: [
          "`\"0\"` is a valid part; `\"00\"` and `\"01\"` are not.",
          "Strings longer than 12 digits (or shorter than 4) have no answer — the length bounds handle this without special cases.",
          "Comparing parts as strings (`\"99\" > \"255\"`) instead of numbers wrongly rejects valid parts.",
        ],
      }),
      examples: [
        { input: '"10203"', expectedOutput: '["1.0.20.3","10.2.0.3"]' },
        { input: '"0000"', expectedOutput: '["0.0.0.0"]' },
        { input: '"1111111111111"', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const len = pick(rng, [ri(rng, 1, 3), ri(rng, 4, 12), ri(rng, 4, 12), ri(rng, 4, 12), ri(rng, 13, 20)]);
        const alpha = pick(rng, ["0123456789", "0123456789", "012", "0125", "0", "1", "25", "2556"]);
        const s = randLower(rng, len, len, alpha);
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def restoreIpAddresses(s: str) -> List[str]:
              res = []
              parts = []

              def dfs(start):
                  if len(parts) == 4:
                      if start == len(s):
                          res.append(".".join(parts))
                      return
                  left = 4 - len(parts)
                  rem = len(s) - start
                  if rem < left or rem > 3 * left:
                      return
                  for ln in range(1, 4):
                      if start + ln > len(s):
                          break
                      seg = s[start:start + ln]
                      if ln > 1 and seg[0] == "0":
                          break
                      if int(seg) > 255:
                          break
                      parts.append(seg)
                      dfs(start + ln)
                      parts.pop()

              dfs(0)
              return res
        `,
        javascript: code`
          var restoreIpAddresses = function(s) {
              var res = [];
              var parts = [];
              var dfs = function(start) {
                  if (parts.length === 4) {
                      if (start === s.length) res.push(parts.join("."));
                      return;
                  }
                  var left = 4 - parts.length, rem = s.length - start;
                  if (rem < left || rem > 3 * left) return;
                  for (var len = 1; len <= 3 && start + len <= s.length; len++) {
                      var seg = s.substring(start, start + len);
                      if (len > 1 && seg[0] === "0") break;
                      if (parseInt(seg, 10) > 255) break;
                      parts.push(seg);
                      dfs(start + len);
                      parts.pop();
                  }
              };
              dfs(0);
              return res;
          };
        `,
        typescript: code`
          function restoreIpAddresses(s: string): string[] {
              var res: string[] = [];
              var parts: string[] = [];
              var dfs = function(start: number): void {
                  if (parts.length === 4) {
                      if (start === s.length) res.push(parts.join("."));
                      return;
                  }
                  var left = 4 - parts.length, rem = s.length - start;
                  if (rem < left || rem > 3 * left) return;
                  for (var len = 1; len <= 3 && start + len <= s.length; len++) {
                      var seg = s.substring(start, start + len);
                      if (len > 1 && seg.charAt(0) === "0") break;
                      if (parseInt(seg, 10) > 255) break;
                      parts.push(seg);
                      dfs(start + len);
                      parts.pop();
                  }
              };
              dfs(0);
              return res;
          }
        `,
        java: code`
          public static String[] restoreIpAddresses(String s) {
              List<String> res = new ArrayList<>();
              ipDfs(s, 0, new ArrayList<String>(), res);
              return res.toArray(new String[0]);
          }

          static void ipDfs(String s, int start, List<String> parts, List<String> res) {
              if (parts.size() == 4) {
                  if (start == s.length()) res.add(String.join(".", parts));
                  return;
              }
              int left = 4 - parts.size(), rem = s.length() - start;
              if (rem < left || rem > 3 * left) return;
              for (int len = 1; len <= 3 && start + len <= s.length(); len++) {
                  String seg = s.substring(start, start + len);
                  if (len > 1 && seg.charAt(0) == '0') break;
                  if (Integer.parseInt(seg) > 255) break;
                  parts.add(seg);
                  ipDfs(s, start + len, parts, res);
                  parts.remove(parts.size() - 1);
              }
          }
        `,
        cpp: code`
          void ipDfs(const string& s, int start, vector<string>& parts, vector<string>& res) {
              if (parts.size() == 4) {
                  if (start == (int)s.size()) res.push_back(parts[0] + "." + parts[1] + "." + parts[2] + "." + parts[3]);
                  return;
              }
              int left = 4 - (int)parts.size(), rem = (int)s.size() - start;
              if (rem < left || rem > 3 * left) return;
              for (int len = 1; len <= 3 && start + len <= (int)s.size(); len++) {
                  string seg = s.substr(start, len);
                  if (len > 1 && seg[0] == '0') break;
                  if (stoi(seg) > 255) break;
                  parts.push_back(seg);
                  ipDfs(s, start + len, parts, res);
                  parts.pop_back();
              }
          }

          vector<string> restoreIpAddresses(string s) {
              vector<string> res, parts;
              ipDfs(s, 0, parts, res);
              return res;
          }
        `,
        c: code`
          static void ipDfs(const char* s, int n, int start, int parts, int* cuts, char*** res, int* cnt, int* cap) {
              if (parts == 4) {
                  if (start == n) {
                      char* ip = (char*)malloc(n + 4);
                      int p = 0, from = 0;
                      for (int k = 0; k < 4; k++) {
                          if (k > 0) ip[p++] = '.';
                          for (int i = from; i < cuts[k]; i++) ip[p++] = s[i];
                          from = cuts[k];
                      }
                      ip[p] = '\0';
                      if (*cnt == *cap) {
                          *cap *= 2;
                          *res = (char**)realloc(*res, *cap * sizeof(char*));
                      }
                      (*res)[(*cnt)++] = ip;
                  }
                  return;
              }
              int left = 4 - parts, rem = n - start;
              if (rem < left || rem > 3 * left) return;
              int value = 0;
              for (int len = 1; len <= 3 && start + len <= n; len++) {
                  if (len > 1 && s[start] == '0') break;
                  value = value * 10 + (s[start + len - 1] - '0');
                  if (value > 255) break;
                  cuts[parts] = start + len;
                  ipDfs(s, n, start + len, parts + 1, cuts, res, cnt, cap);
              }
          }

          char** restoreIpAddresses(const char* s, int* returnSize) {
              int n = (int)strlen(s), cnt = 0, cap = 16;
              char** res = (char**)malloc(cap * sizeof(char*));
              int cuts[4];
              ipDfs(s, n, 0, 0, cuts, &res, &cnt, &cap);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] RestoreIpAddresses(string s)
          {
              var res = new List<string>();
              IpDfs(s, 0, new List<string>(), res);
              return res.ToArray();
          }

          static void IpDfs(string s, int start, List<string> parts, List<string> res)
          {
              if (parts.Count == 4)
              {
                  if (start == s.Length) res.Add(string.Join(".", parts));
                  return;
              }
              int left = 4 - parts.Count, rem = s.Length - start;
              if (rem < left || rem > 3 * left) return;
              for (int len = 1; len <= 3 && start + len <= s.Length; len++)
              {
                  string seg = s.Substring(start, len);
                  if (len > 1 && seg[0] == '0') break;
                  if (int.Parse(seg) > 255) break;
                  parts.Add(seg);
                  IpDfs(s, start + len, parts, res);
                  parts.RemoveAt(parts.Count - 1);
              }
          }
        `,
        go: code`
          func restoreIpAddresses(s string) []string {
          	res := []string{}
          	parts := []string{}
          	var dfs func(start int)
          	dfs = func(start int) {
          		if len(parts) == 4 {
          			if start == len(s) {
          				res = append(res, strings.Join(parts, "."))
          			}
          			return
          		}
          		left, rem := 4-len(parts), len(s)-start
          		if rem < left || rem > 3*left {
          			return
          		}
          		value := 0
          		for ln := 1; ln <= 3 && start+ln <= len(s); ln++ {
          			if ln > 1 && s[start] == '0' {
          				break
          			}
          			value = value*10 + int(s[start+ln-1]-'0')
          			if value > 255 {
          				break
          			}
          			parts = append(parts, s[start:start+ln])
          			dfs(start + ln)
          			parts = parts[:len(parts)-1]
          		}
          	}
          	dfs(0)
          	return res
          }
        `,
        kotlin: code`
          fun restoreIpAddresses(s: String): Array<String> {
              val res = ArrayList<String>()
              val parts = ArrayList<String>()
              fun dfs(start: Int) {
                  if (parts.size == 4) {
                      if (start == s.length) res.add(parts.joinToString("."))
                      return
                  }
                  val left = 4 - parts.size
                  val rem = s.length - start
                  if (rem < left || rem > 3 * left) return
                  var value = 0
                  var len = 1
                  while (len <= 3 && start + len <= s.length) {
                      if (len > 1 && s[start] == '0') break
                      value = value * 10 + (s[start + len - 1] - '0')
                      if (value > 255) break
                      parts.add(s.substring(start, start + len))
                      dfs(start + len)
                      parts.removeAt(parts.size - 1)
                      len++
                  }
              }
              dfs(0)
              return res.toTypedArray()
          }
        `,
        swift: code`
          func restoreIpAddresses(_ s: String) -> [String] {
              let chars = Array(s)
              let d = Array(s.utf8).map { Int($0) - 48 }
              let n = d.count
              var res = [String]()
              var parts = [String]()
              func dfs(_ start: Int) {
                  if parts.count == 4 {
                      if start == n { res.append(parts.joined(separator: ".")) }
                      return
                  }
                  let left = 4 - parts.count
                  let rem = n - start
                  if rem < left || rem > 3 * left { return }
                  var value = 0
                  var len = 1
                  while len <= 3 && start + len <= n {
                      if len > 1 && d[start] == 0 { break }
                      value = value * 10 + d[start + len - 1]
                      if value > 255 { break }
                      parts.append(String(chars[start..<(start + len)]))
                      dfs(start + len)
                      parts.removeLast()
                      len += 1
                  }
              }
              dfs(0)
              return res
          }
        `,
        rust: code`
          fn restoreIpAddresses(s: String) -> Vec<String> {
              let b: Vec<u8> = s.into_bytes();
              let mut res: Vec<String> = Vec::new();
              let mut cuts = [0usize; 4];
              ip_dfs(&b, 0, 0, &mut cuts, &mut res);
              res
          }

          fn ip_dfs(b: &Vec<u8>, start: usize, parts: usize, cuts: &mut [usize; 4], res: &mut Vec<String>) {
              let n = b.len();
              if parts == 4 {
                  if start == n {
                      let mut ip = String::new();
                      let mut from = 0;
                      for k in 0..4 {
                          if k > 0 {
                              ip.push('.');
                          }
                          for i in from..cuts[k] {
                              ip.push(b[i] as char);
                          }
                          from = cuts[k];
                      }
                      res.push(ip);
                  }
                  return;
              }
              let left = 4 - parts;
              let rem = n - start;
              if rem < left || rem > 3 * left {
                  return;
              }
              let mut value: i32 = 0;
              let mut len = 1;
              while len <= 3 && start + len <= n {
                  if len > 1 && b[start] == b'0' {
                      break;
                  }
                  value = value * 10 + (b[start + len - 1] - b'0') as i32;
                  if value > 255 {
                      break;
                  }
                  cuts[parts] = start + len;
                  ip_dfs(b, start + len, parts + 1, cuts, res);
                  len += 1;
              }
          }
        `,
        php: code`
          function restoreIpAddresses($s) {
              $res = [];
              ipDfs($s, 0, [], $res);
              return $res;
          }

          function ipDfs($s, $start, $parts, &$res) {
              $n = strlen($s);
              if (count($parts) == 4) {
                  if ($start == $n) $res[] = implode(".", $parts);
                  return;
              }
              $left = 4 - count($parts);
              $rem = $n - $start;
              if ($rem < $left || $rem > 3 * $left) return;
              for ($len = 1; $len <= 3 && $start + $len <= $n; $len++) {
                  $seg = substr($s, $start, $len);
                  if ($len > 1 && $seg[0] === "0") break;
                  if (intval($seg) > 255) break;
                  $parts[] = $seg;
                  ipDfs($s, $start + $len, $parts, $res);
                  array_pop($parts);
              }
          }
        `,
        ruby: code`
          def restoreIpAddresses(s)
            res = []
            ip_dfs(s, 0, [], res)
            res
          end

          def ip_dfs(s, start, parts, res)
            n = s.length
            if parts.length == 4
              res << parts.join(".") if start == n
              return
            end
            left = 4 - parts.length
            rem = n - start
            return if rem < left || rem > 3 * left
            (1..3).each do |len|
              break if start + len > n
              seg = s[start, len]
              break if len > 1 && seg[0] == "0"
              break if seg.to_i > 255
              parts << seg
              ip_dfs(s, start + len, parts, res)
              parts.pop
            end
          end
        `,
      },
    };
  })(),

  // ── Repeated DNA Sequences (LC 187) ─────────────────────────────
  (() => {
    const ref = (s: string) => {
      const seen = new Map<string, number>();
      for (let i = 0; i + 10 <= s.length; i++) {
        const t = s.slice(i, i + 10);
        seen.set(t, (seen.get(t) || 0) + 1);
      }
      const out: string[] = [];
      seen.forEach((c, t) => { if (c > 1) out.push(t); });
      return out.sort();
    };
    return {
      slug: "repeated-dna-sequences",
      title: "Repeated DNA Sequences",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Rolling Hash", "Amazon", "Google", "LinkedIn"],
      signature: { funcName: "findRepeatedDnaSequences", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "A DNA strand is written as a string over the letters `A`, `C`, `G` and `T`.\n\nGiven a strand `s`, return every substring of length exactly **10** that occurs **more than once** in `s` (occurrences may overlap). Each such substring is listed once, and the list is sorted in ascending lexicographic order. Return an empty list if there is none.",
        [
          { in: "s = \"ACGTTGCAACACGTTGCAACGT\"", out: "[\"ACGTTGCAAC\"]", note: "`ACGTTGCAAC` starts at indices 0 and 10." },
          { in: "s = \"CCCCCCCCCCCC\"", out: "[\"CCCCCCCCCC\"]", note: "Overlapping occurrences at 0, 1 and 2 count." },
          { in: "s = \"GATTACA\"", out: "[]" },
        ],
        ["1 <= s.length <= 10^5", "s[i] is one of 'A', 'C', 'G', 'T'"]),
      hints: [
        "Slide a window of length 10 across `s` and count each window you see.",
        "A hash map from window to count finds the repeats in one pass; report a window the moment its count reaches 2 so it is listed once.",
        "With four letters a window fits in 20 bits (2 bits per letter), so it can be kept as an integer and updated in O(1) per step.",
      ],
      editorial: explain({
        idea: "Every candidate is one of the `n − 9` windows of length 10, so counting windows in a hash map finds exactly the repeated ones.",
        steps: [
          "For each start `i` from 0 to `n − 10`, take the window `s[i..i+9]`.",
          "Increment its count; when the count becomes exactly 2, append the window to the answer.",
          "Sort the answer.",
          "(Optional) Encode A, C, G, T as 0–3 and keep the window as a 20-bit integer: shift left by 2, add the new letter, mask to 20 bits. Because A < C < G < T, sorting the codes numerically sorts the strings too.",
        ],
        why: "A length-10 substring that occurs twice is, by definition, two windows with equal content, so it reaches count 2 in the map; adding it only at that moment lists each repeated sequence exactly once no matter how many more times it appears.",
        time: "O(n · 10) with string keys, O(n) with the rolling 20-bit code (plus sorting the answer)",
        space: "O(n)",
        pitfalls: [
          "Adding a window every time its count is ≥ 2 lists sequences that occur three times twice.",
          "Strings shorter than 10 have no windows — make sure the loop bound does not go negative.",
          "Occurrences may overlap (`CCCCCCCCCCC` repeats `CCCCCCCCCC`); do not skip ahead after a match.",
        ],
      }),
      examples: [
        { input: '"ACGTTGCAACACGTTGCAACGT"', expectedOutput: '["ACGTTGCAAC"]' },
        { input: '"CCCCCCCCCCCC"', expectedOutput: '["CCCCCCCCCC"]' },
        { input: '"GATTACA"', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 3);
        let s: string;
        if (kind === 0) s = randLower(rng, 1, 12, pick(rng, ["ACGT", "A", "AC"]));
        else if (kind === 1) s = randLower(rng, 10, 60, pick(rng, ["ACGT", "AC", "AG", "CGT", "T"]));
        else {
          const unit = randLower(rng, 10, 10, pick(rng, ["ACGT", "ACGT", "GT"]));
          const parts: string[] = [];
          const k = ri(rng, 2, 3);
          for (let i = 0; i < k; i++) parts.push(randLower(rng, 0, 8, "ACGT"), unit);
          parts.push(randLower(rng, 0, 8, "ACGT"));
          s = parts.join("");
        }
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findRepeatedDnaSequences(s: str) -> List[str]:
              seen = {}
              res = []
              for i in range(len(s) - 9):
                  t = s[i:i + 10]
                  c = seen.get(t, 0) + 1
                  seen[t] = c
                  if c == 2:
                      res.append(t)
              res.sort()
              return res
        `,
        javascript: code`
          var findRepeatedDnaSequences = function(s) {
              var seen = new Map();
              var res = [];
              for (var i = 0; i + 10 <= s.length; i++) {
                  var t = s.substring(i, i + 10);
                  var c = (seen.has(t) ? seen.get(t) : 0) + 1;
                  seen.set(t, c);
                  if (c === 2) res.push(t);
              }
              res.sort();
              return res;
          };
        `,
        typescript: code`
          function findRepeatedDnaSequences(s: string): string[] {
              var seen: { [k: string]: number } = {};
              var res: string[] = [];
              for (var i = 0; i + 10 <= s.length; i++) {
                  var t = s.substring(i, i + 10);
                  var c = (seen[t] === undefined ? 0 : seen[t]) + 1;
                  seen[t] = c;
                  if (c === 2) res.push(t);
              }
              res.sort();
              return res;
          }
        `,
        java: code`
          public static String[] findRepeatedDnaSequences(String s) {
              Map<String, Integer> seen = new HashMap<>();
              List<String> res = new ArrayList<>();
              for (int i = 0; i + 10 <= s.length(); i++) {
                  String t = s.substring(i, i + 10);
                  int c = seen.getOrDefault(t, 0) + 1;
                  seen.put(t, c);
                  if (c == 2) res.add(t);
              }
              Collections.sort(res);
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> findRepeatedDnaSequences(string s) {
              unordered_map<string, int> seen;
              vector<string> res;
              for (int i = 0; i + 10 <= (int)s.size(); i++) {
                  string t = s.substr(i, 10);
                  if (++seen[t] == 2) res.push_back(t);
              }
              sort(res.begin(), res.end());
              return res;
          }
        `,
        c: code`
          static unsigned char dnaSeen[1 << 20];

          static int dnaCode(char ch) {
              if (ch == 'A') return 0;
              if (ch == 'C') return 1;
              if (ch == 'G') return 2;
              return 3;
          }

          static int dnaCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          char** findRepeatedDnaSequences(const char* s, int* returnSize) {
              int n = (int)strlen(s);
              int* hits = (int*)malloc((n + 1) * sizeof(int));
              int cnt = 0, mask = (1 << 20) - 1, cur = 0;
              for (int i = 0; i < n; i++) {
                  cur = ((cur << 2) | dnaCode(s[i])) & mask;
                  if (i >= 9) {
                      if (dnaSeen[cur] == 1) hits[cnt++] = cur;
                      if (dnaSeen[cur] < 2) dnaSeen[cur]++;
                  }
              }
              cur = 0;
              for (int i = 0; i < n; i++) {
                  cur = ((cur << 2) | dnaCode(s[i])) & mask;
                  if (i >= 9) dnaSeen[cur] = 0;
              }
              qsort(hits, cnt, sizeof(int), dnaCmp);
              char** res = (char**)malloc((cnt + 1) * sizeof(char*));
              const char* letters = "ACGT";
              for (int k = 0; k < cnt; k++) {
                  char* t = (char*)malloc(11);
                  for (int j = 0; j < 10; j++) t[j] = letters[(hits[k] >> (2 * (9 - j))) & 3];
                  t[10] = '\0';
                  res[k] = t;
              }
              free(hits);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] FindRepeatedDnaSequences(string s)
          {
              var seen = new Dictionary<string, int>();
              var res = new List<string>();
              for (int i = 0; i + 10 <= s.Length; i++)
              {
                  string t = s.Substring(i, 10);
                  int c;
                  seen.TryGetValue(t, out c);
                  c++;
                  seen[t] = c;
                  if (c == 2) res.Add(t);
              }
              res.Sort(string.CompareOrdinal);
              return res.ToArray();
          }
        `,
        go: code`
          func findRepeatedDnaSequences(s string) []string {
          	seen := map[string]int{}
          	res := []string{}
          	for i := 0; i+10 <= len(s); i++ {
          		t := s[i : i+10]
          		seen[t]++
          		if seen[t] == 2 {
          			res = append(res, t)
          		}
          	}
          	sort.Strings(res)
          	return res
          }
        `,
        kotlin: code`
          fun findRepeatedDnaSequences(s: String): Array<String> {
              val seen = HashMap<String, Int>()
              val res = ArrayList<String>()
              var i = 0
              while (i + 10 <= s.length) {
                  val t = s.substring(i, i + 10)
                  val c = (seen[t] ?: 0) + 1
                  seen[t] = c
                  if (c == 2) res.add(t)
                  i++
              }
              res.sort()
              return res.toTypedArray()
          }
        `,
        swift: code`
          func findRepeatedDnaSequences(_ s: String) -> [String] {
              let chars = Array(s)
              var seen = [String: Int]()
              var res = [String]()
              var i = 0
              while i + 10 <= chars.count {
                  let t = String(chars[i..<(i + 10)])
                  let c = (seen[t] ?? 0) + 1
                  seen[t] = c
                  if c == 2 { res.append(t) }
                  i += 1
              }
              res.sort()
              return res
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn findRepeatedDnaSequences(s: String) -> Vec<String> {
              let mut seen: HashMap<&str, i32> = HashMap::new();
              let mut res: Vec<String> = Vec::new();
              let mut i = 0;
              while i + 10 <= s.len() {
                  let t = &s[i..i + 10];
                  let c = seen.entry(t).or_insert(0);
                  *c += 1;
                  if *c == 2 {
                      res.push(t.to_string());
                  }
                  i += 1;
              }
              res.sort();
              res
          }
        `,
        php: code`
          function findRepeatedDnaSequences($s) {
              $seen = [];
              $res = [];
              $n = strlen($s);
              for ($i = 0; $i + 10 <= $n; $i++) {
                  $t = substr($s, $i, 10);
                  $c = (isset($seen[$t]) ? $seen[$t] : 0) + 1;
                  $seen[$t] = $c;
                  if ($c == 2) $res[] = $t;
              }
              sort($res, SORT_STRING);
              return $res;
          }
        `,
        ruby: code`
          def findRepeatedDnaSequences(s)
            seen = Hash.new(0)
            res = []
            (0..s.length - 10).each do |i|
              t = s[i, 10]
              seen[t] += 1
              res << t if seen[t] == 2
            end
            res.sort
          end
        `,
      },
    };
  })(),

  // ── Bulls and Cows (LC 299) ─────────────────────────────────────
  (() => {
    const ref = (secret: string, guess: string) => {
      let bulls = 0;
      const usedS: boolean[] = [], usedG: boolean[] = [];
      for (let i = 0; i < secret.length; i++) {
        if (secret[i] === guess[i]) { bulls++; usedS[i] = usedG[i] = true; }
      }
      let cows = 0;
      for (let i = 0; i < guess.length; i++) {
        if (usedG[i]) continue;
        for (let j = 0; j < secret.length; j++) {
          if (!usedS[j] && secret[j] === guess[i]) { usedS[j] = true; cows++; break; }
        }
      }
      return `${bulls}A${cows}B`;
    };
    return {
      slug: "bulls-and-cows",
      title: "Bulls and Cows",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "getHint", params: [{ name: "secret", type: "string" as const }, { name: "guess", type: "string" as const }], returns: "string" as const },
      description: describe(
        "In the Bulls and Cows game one player picks a secret digit string and the other makes a guess of the same length. The hint for a guess has two numbers:\n\n- **bulls** — positions where the guess has the same digit as the secret;\n- **cows** — digits of the guess that occur in the secret but at a different position, where every secret digit can be matched at most once and bull positions are not available for cows.\n\nPut differently, after removing the bull positions from both strings, the cows are the size of the largest one-to-one matching of equal digits between what is left.\n\nReturn the hint as `\"xAyB\"`, where `x` is the number of bulls and `y` the number of cows. Both strings may contain repeated digits.",
        [
          { in: "secret = \"9305\", guess = \"9530\"", out: '"1A3B"', note: "The 9 is a bull; 5, 3 and 0 are all in the secret elsewhere." },
          { in: "secret = \"2024\", guess = \"4202\"", out: '"0A4B"' },
          { in: "secret = \"1112\", guess = \"1221\"", out: '"1A2B"', note: "Index 0 is a bull. Left over: secret `112`, guess `221` — one `1` and one `2` match, the second `2` has no partner." },
        ],
        ["1 <= secret.length, guess.length <= 1000", "secret.length == guess.length", "secret and guess consist of digits only"]),
      hints: [
        "Bulls are easy: compare position by position.",
        "For the cows, only the non-bull positions matter, and their order does not matter — just how many of each digit each side has left.",
        "Count digits on each side over the non-bull positions; the cows are the sum over digits of the smaller of the two counts.",
      ],
      editorial: explain({
        idea: "Bulls are positional; cows are a multiset intersection of the leftover digits, which is the sum of per-digit minimum counts.",
        steps: [
          "Keep two arrays of 10 counters, one for the secret and one for the guess.",
          "Scan the positions: if `secret[i] == guess[i]`, count a bull; otherwise increment the counter of `secret[i]` on the secret side and `guess[i]` on the guess side.",
          "The cows are `Σ_d min(secretCount[d], guessCount[d])`.",
          "Return `bulls + \"A\" + cows + \"B\"`.",
        ],
        why: "A digit `d` left over `a` times in the secret and `b` times in the guess can be paired at most `min(a, b)` times, since each secret digit is used once, and that many pairs can always be formed; different digits never interact, so summing the minimums gives the largest matching.",
        time: "O(n)",
        space: "O(1) — two arrays of 10 counters",
        pitfalls: [
          "Counting cows before removing the bull positions double-counts digits that are bulls.",
          "With repeated digits, a single guess digit cannot match two secret digits — use the minimum, not the guess count.",
          "The answer is a string such as `\"0A0B\"`, not two numbers.",
        ],
      }),
      examples: [
        { input: '"9305"\n"9530"', expectedOutput: "1A3B" },
        { input: '"2024"\n"4202"', expectedOutput: "0A4B" },
        { input: '"1112"\n"1221"', expectedOutput: "1A2B" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 4), ri(rng, 5, 12), ri(rng, 5, 12), ri(rng, 13, 30)]);
        const alpha = pick(rng, ["0123456789", "0123456789", "01", "123", "7"]);
        const secret = randLower(rng, n, n, alpha);
        const mode = ri(rng, 0, 3);
        const guess = mode === 0 ? shuffle(rng, secret.split("")).join("")
          : mode === 1 ? secret
          : randLower(rng, n, n, pick(rng, [alpha, "0123456789"]));
        return { input: `"${secret}"\n"${guess}"`, expectedOutput: ref(secret, guess) };
      },
      solutions: {
        python: code`
          def getHint(secret: str, guess: str) -> str:
              bulls = 0
              cs = [0] * 10
              cg = [0] * 10
              for a, b in zip(secret, guess):
                  if a == b:
                      bulls += 1
                  else:
                      cs[ord(a) - 48] += 1
                      cg[ord(b) - 48] += 1
              cows = sum(min(cs[d], cg[d]) for d in range(10))
              return str(bulls) + "A" + str(cows) + "B"
        `,
        javascript: code`
          var getHint = function(secret, guess) {
              var bulls = 0, cows = 0;
              var cs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              var cg = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < secret.length; i++) {
                  if (secret[i] === guess[i]) bulls++;
                  else {
                      cs[secret.charCodeAt(i) - 48]++;
                      cg[guess.charCodeAt(i) - 48]++;
                  }
              }
              for (var d = 0; d < 10; d++) cows += Math.min(cs[d], cg[d]);
              return bulls + "A" + cows + "B";
          };
        `,
        typescript: code`
          function getHint(secret: string, guess: string): string {
              var bulls = 0, cows = 0;
              var cs: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              var cg: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < secret.length; i++) {
                  if (secret.charAt(i) === guess.charAt(i)) bulls++;
                  else {
                      cs[secret.charCodeAt(i) - 48]++;
                      cg[guess.charCodeAt(i) - 48]++;
                  }
              }
              for (var d = 0; d < 10; d++) cows += Math.min(cs[d], cg[d]);
              return bulls + "A" + cows + "B";
          }
        `,
        java: code`
          public static String getHint(String secret, String guess) {
              int bulls = 0, cows = 0;
              int[] cs = new int[10], cg = new int[10];
              for (int i = 0; i < secret.length(); i++) {
                  char a = secret.charAt(i), b = guess.charAt(i);
                  if (a == b) bulls++;
                  else {
                      cs[a - '0']++;
                      cg[b - '0']++;
                  }
              }
              for (int d = 0; d < 10; d++) cows += Math.min(cs[d], cg[d]);
              return bulls + "A" + cows + "B";
          }
        `,
        cpp: code`
          string getHint(string secret, string guess) {
              int bulls = 0, cows = 0;
              int cs[10] = {0}, cg[10] = {0};
              for (size_t i = 0; i < secret.size(); i++) {
                  if (secret[i] == guess[i]) bulls++;
                  else {
                      cs[secret[i] - '0']++;
                      cg[guess[i] - '0']++;
                  }
              }
              for (int d = 0; d < 10; d++) cows += min(cs[d], cg[d]);
              return to_string(bulls) + "A" + to_string(cows) + "B";
          }
        `,
        c: code`
          char* getHint(const char* secret, const char* guess) {
              int bulls = 0, cows = 0;
              int cs[10] = {0}, cg[10] = {0};
              for (int i = 0; secret[i] != '\0'; i++) {
                  if (secret[i] == guess[i]) bulls++;
                  else {
                      cs[secret[i] - '0']++;
                      cg[guess[i] - '0']++;
                  }
              }
              for (int d = 0; d < 10; d++) cows += cs[d] < cg[d] ? cs[d] : cg[d];
              char* out = (char*)malloc(32);
              sprintf(out, "%dA%dB", bulls, cows);
              return out;
          }
        `,
        csharp: code`
          public static string GetHint(string secret, string guess)
          {
              int bulls = 0, cows = 0;
              int[] cs = new int[10], cg = new int[10];
              for (int i = 0; i < secret.Length; i++)
              {
                  if (secret[i] == guess[i]) bulls++;
                  else
                  {
                      cs[secret[i] - '0']++;
                      cg[guess[i] - '0']++;
                  }
              }
              for (int d = 0; d < 10; d++) cows += Math.Min(cs[d], cg[d]);
              return bulls + "A" + cows + "B";
          }
        `,
        go: code`
          func getHint(secret string, guess string) string {
          	bulls, cows := 0, 0
          	var cs, cg [10]int
          	for i := 0; i < len(secret); i++ {
          		if secret[i] == guess[i] {
          			bulls++
          		} else {
          			cs[secret[i]-'0']++
          			cg[guess[i]-'0']++
          		}
          	}
          	for d := 0; d < 10; d++ {
          		if cs[d] < cg[d] {
          			cows += cs[d]
          		} else {
          			cows += cg[d]
          		}
          	}
          	return fmt.Sprintf("%dA%dB", bulls, cows)
          }
        `,
        kotlin: code`
          fun getHint(secret: String, guess: String): String {
              var bulls = 0
              var cows = 0
              val cs = IntArray(10)
              val cg = IntArray(10)
              for (i in secret.indices) {
                  if (secret[i] == guess[i]) bulls++
                  else {
                      cs[secret[i] - '0']++
                      cg[guess[i] - '0']++
                  }
              }
              for (d in 0 until 10) cows += minOf(cs[d], cg[d])
              return "" + bulls + "A" + cows + "B"
          }
        `,
        swift: code`
          func getHint(_ secret: String, _ guess: String) -> String {
              let a = Array(secret.utf8), b = Array(guess.utf8)
              var bulls = 0, cows = 0
              var cs = [Int](repeating: 0, count: 10), cg = [Int](repeating: 0, count: 10)
              for i in 0..<a.count {
                  if a[i] == b[i] {
                      bulls += 1
                  } else {
                      cs[Int(a[i]) - 48] += 1
                      cg[Int(b[i]) - 48] += 1
                  }
              }
              for d in 0..<10 { cows += min(cs[d], cg[d]) }
              return "\(bulls)A\(cows)B"
          }
        `,
        rust: code`
          fn getHint(secret: String, guess: String) -> String {
              let a = secret.as_bytes();
              let b = guess.as_bytes();
              let mut bulls = 0;
              let mut cows = 0;
              let mut cs = [0i32; 10];
              let mut cg = [0i32; 10];
              for i in 0..a.len() {
                  if a[i] == b[i] {
                      bulls += 1;
                  } else {
                      cs[(a[i] - b'0') as usize] += 1;
                      cg[(b[i] - b'0') as usize] += 1;
                  }
              }
              for d in 0..10 {
                  cows += std::cmp::min(cs[d], cg[d]);
              }
              format!("{}A{}B", bulls, cows)
          }
        `,
        php: code`
          function getHint($secret, $guess) {
              $bulls = 0;
              $cows = 0;
              $cs = array_fill(0, 10, 0);
              $cg = array_fill(0, 10, 0);
              $n = strlen($secret);
              for ($i = 0; $i < $n; $i++) {
                  if ($secret[$i] === $guess[$i]) $bulls++;
                  else {
                      $cs[ord($secret[$i]) - 48]++;
                      $cg[ord($guess[$i]) - 48]++;
                  }
              }
              for ($d = 0; $d < 10; $d++) $cows += min($cs[$d], $cg[$d]);
              return $bulls . "A" . $cows . "B";
          }
        `,
        ruby: code`
          def getHint(secret, guess)
            bulls = 0
            cs = Array.new(10, 0)
            cg = Array.new(10, 0)
            secret.length.times do |i|
              if secret[i] == guess[i]
                bulls += 1
              else
                cs[secret[i].ord - 48] += 1
                cg[guess[i].ord - 48] += 1
              end
            end
            cows = (0...10).sum { |d| [cs[d], cg[d]].min }
            "#{bulls}A#{cows}B"
          end
        `,
      },
    };
  })(),

  // ── Additive Number (LC 306) ────────────────────────────────────
  (() => {
    const ref = (num: string) => {
      const n = num.length;
      for (let i = 1; i < n; i++) for (let j = 1; i + j < n; j++) {
        let a = num.slice(0, i), b = num.slice(i, i + j);
        if ((a.length > 1 && a[0] === "0") || (b.length > 1 && b[0] === "0")) continue;
        let pos = i + j, ok = true;
        while (pos < n) {
          const c = (BigInt(a) + BigInt(b)).toString();
          if (!num.startsWith(c, pos)) { ok = false; break; }
          pos += c.length; a = b; b = c;
        }
        if (ok) return true;
      }
      return false;
    };
    return {
      slug: "additive-number",
      title: "Additive Number",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Enumeration", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "isAdditiveNumber", params: [{ name: "num", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A digit string is **additive** if it can be cut into a sequence of **at least three** numbers in which every number after the first two equals the sum of the two numbers just before it.\n\nNo number in the sequence may have a leading zero: `0` itself is allowed, but a piece such as `02` or `00` is not.\n\nGiven a digit string `num`, return `true` if it is additive.",
        [
          { in: "num = \"12122436\"", out: "true", note: "12 + 12 = 24 and 12 + 24 = 36." },
          { in: "num = \"101\"", out: "true", note: "1 + 0 = 1." },
          { in: "num = \"1023\"", out: "false", note: "`1, 0, 2…` fails (1 + 0 ≠ 2), and any cut starting `1, 02` uses a leading zero." },
        ],
        ["1 <= num.length <= 35", "num consists of digits only"],
        "How would you handle inputs so long that the numbers overflow 64-bit integers?"),
      hints: [
        "Once the first two numbers are fixed, the rest of the sequence is forced — each next number must be their sum.",
        "So try every length for the first number and every length for the second, then verify greedily.",
        "Reject first/second pieces with a leading zero, and skip pairs whose longer piece is longer than what is left of the string (their sum could not fit).",
      ],
      editorial: explain({
        idea: "The first two numbers determine the whole sequence, so enumerate their lengths and check each candidate by repeatedly adding and matching the sum against the string.",
        steps: [
          "For each length `i` of the first number and `j` of the second with `i + j < n`: stop growing `i` once it would start with a `0` and be longer than one digit; do the same for `j` with the digit at index `i`.",
          "Skip the pair when `max(i, j) > n − i − j`: the third number is at least as long as the longer of the two, so it could not fit.",
          "Set `a`, `b` to the two pieces and `pos = i + j`. While `pos < n`, compute `c = a + b`, check that `num` continues with the digits of `c` at `pos`, advance `pos` by its length, and shift `a, b = b, c`.",
          "If a candidate reaches the end of the string, return `true`; if all fail, return `false`.",
        ],
        why: "Every valid split is found by exactly one choice of `(i, j)` because the remaining numbers are forced, and the verification follows that forced sequence. A computed sum never has a leading zero, so matching its digits respects the rule automatically. With at most 35 digits, the pruning keeps both starting pieces to 17 digits and every matched number stays below 10^17, so 64-bit integers suffice; for unbounded lengths, add the numbers as digit strings instead (the JavaScript and TypeScript solutions do this, since their numbers are only exact to 2^53).",
        time: "O(n^3) — O(n^2) starting pairs, each verified in O(n)",
        space: "O(n)",
        pitfalls: [
          "A sequence needs at least three numbers — `i + j` must be strictly less than `n`.",
          "`0` is a valid number, so `\"000\"` and `\"101\"` are additive; only multi-digit pieces with a leading zero are invalid.",
          "Floating-point or 53-bit arithmetic silently loses digits on long inputs.",
        ],
      }),
      examples: [
        { input: '"12122436"', expectedOutput: "true" },
        { input: '"101"', expectedOutput: "true" },
        { input: '"1023"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 5);
        let s: string;
        if (kind <= 2) {
          // Up to 11-digit starting numbers, so sums overflow 32 bits.
          const start = () => BigInt(pick(rng, [ri(rng, 0, 9), ri(rng, 0, 99), ri(rng, 0, 9999), ri(rng, 0, 99999999), ri(rng, 0, 99999999999)]));
          let a = start(), b = start();
          let str = a.toString() + b.toString(), count = 2;
          for (;;) {
            const c = a + b;
            if (str.length + c.toString().length > 35) break;
            str += c.toString(); count++;
            a = b; b = c;
            if (count >= 3 && rng() < 0.25) break;
          }
          if (count < 3) str = pick(rng, ["112", "000", "1235", "101", "123"]);
          s = str;
          if (kind === 2) {
            const chars = s.split("");
            const p = ri(rng, 0, chars.length - 1);
            const op = ri(rng, 0, 2);
            if (op === 0) chars[p] = String(ri(rng, 0, 9));
            else if (op === 1 && chars.length > 1) chars.splice(p, 1);
            else if (chars.length < 35) chars.splice(p, 0, String(ri(rng, 0, 9)));
            s = chars.join("");
          }
        } else {
          s = randLower(rng, 1, pick(rng, [5, 12, 35]), pick(rng, ["0123456789", "01", "012", "0"]));
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def isAdditiveNumber(num: str) -> bool:
              n = len(num)
              for i in range(1, n):
                  if num[0] == "0" and i > 1:
                      break
                  for j in range(1, n - i):
                      if num[i] == "0" and j > 1:
                          break
                      if max(i, j) > n - i - j:
                          continue
                      a, b = int(num[:i]), int(num[i:i + j])
                      pos = i + j
                      ok = True
                      while pos < n:
                          c = a + b
                          cs = str(c)
                          if not num.startswith(cs, pos):
                              ok = False
                              break
                          pos += len(cs)
                          a, b = b, c
                      if ok:
                          return True
              return False
        `,
        javascript: code`
          var isAdditiveNumber = function(num) {
              var n = num.length;
              var add = function(a, b) {
                  var res = [], i = a.length - 1, j = b.length - 1, carry = 0;
                  while (i >= 0 || j >= 0 || carry > 0) {
                      var sum = carry;
                      if (i >= 0) sum += a.charCodeAt(i--) - 48;
                      if (j >= 0) sum += b.charCodeAt(j--) - 48;
                      res.push(sum % 10);
                      carry = sum >= 10 ? 1 : 0;
                  }
                  return res.reverse().join("");
              };
              for (var i = 1; i < n; i++) {
                  if (num[0] === "0" && i > 1) break;
                  for (var j = 1; i + j < n; j++) {
                      if (num[i] === "0" && j > 1) break;
                      if (Math.max(i, j) > n - i - j) continue;
                      var a = num.substring(0, i), b = num.substring(i, i + j), pos = i + j, ok = true;
                      while (pos < n) {
                          var c = add(a, b);
                          if (num.substring(pos, pos + c.length) !== c) { ok = false; break; }
                          pos += c.length;
                          a = b;
                          b = c;
                      }
                      if (ok) return true;
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function isAdditiveNumber(num: string): boolean {
              var n = num.length;
              var add = function(a: string, b: string): string {
                  var res: number[] = [], i = a.length - 1, j = b.length - 1, carry = 0;
                  while (i >= 0 || j >= 0 || carry > 0) {
                      var sum = carry;
                      if (i >= 0) sum += a.charCodeAt(i--) - 48;
                      if (j >= 0) sum += b.charCodeAt(j--) - 48;
                      res.push(sum % 10);
                      carry = sum >= 10 ? 1 : 0;
                  }
                  return res.reverse().join("");
              };
              for (var i = 1; i < n; i++) {
                  if (num.charAt(0) === "0" && i > 1) break;
                  for (var j = 1; i + j < n; j++) {
                      if (num.charAt(i) === "0" && j > 1) break;
                      if (Math.max(i, j) > n - i - j) continue;
                      var a = num.substring(0, i), b = num.substring(i, i + j), pos = i + j, ok = true;
                      while (pos < n) {
                          var c = add(a, b);
                          if (num.substring(pos, pos + c.length) !== c) { ok = false; break; }
                          pos += c.length;
                          a = b;
                          b = c;
                      }
                      if (ok) return true;
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean isAdditiveNumber(String num) {
              int n = num.length();
              for (int i = 1; i < n; i++) {
                  if (num.charAt(0) == '0' && i > 1) break;
                  for (int j = 1; i + j < n; j++) {
                      if (num.charAt(i) == '0' && j > 1) break;
                      if (Math.max(i, j) > n - i - j) continue;
                      long a = Long.parseLong(num.substring(0, i));
                      long b = Long.parseLong(num.substring(i, i + j));
                      int pos = i + j;
                      boolean ok = true;
                      while (pos < n) {
                          long c = a + b;
                          String cs = Long.toString(c);
                          if (!num.startsWith(cs, pos)) { ok = false; break; }
                          pos += cs.length();
                          a = b;
                          b = c;
                      }
                      if (ok) return true;
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool isAdditiveNumber(string num) {
              int n = (int)num.size();
              for (int i = 1; i < n; i++) {
                  if (num[0] == '0' && i > 1) break;
                  for (int j = 1; i + j < n; j++) {
                      if (num[i] == '0' && j > 1) break;
                      if (max(i, j) > n - i - j) continue;
                      long long a = stoll(num.substr(0, i)), b = stoll(num.substr(i, j));
                      int pos = i + j;
                      bool ok = true;
                      while (pos < n) {
                          long long c = a + b;
                          string cs = to_string(c);
                          if (num.substr(pos, cs.size()) != cs) { ok = false; break; }
                          pos += (int)cs.size();
                          a = b;
                          b = c;
                      }
                      if (ok) return true;
                  }
              }
              return false;
          }
        `,
        c: code`
          bool isAdditiveNumber(const char* num) {
              int n = (int)strlen(num);
              char buf[32];
              for (int i = 1; i < n; i++) {
                  if (num[0] == '0' && i > 1) break;
                  for (int j = 1; i + j < n; j++) {
                      if (num[i] == '0' && j > 1) break;
                      int mx = i > j ? i : j;
                      if (mx > n - i - j) continue;
                      long long a = 0, b = 0;
                      for (int k = 0; k < i; k++) a = a * 10 + (num[k] - '0');
                      for (int k = i; k < i + j; k++) b = b * 10 + (num[k] - '0');
                      int pos = i + j;
                      bool ok = true;
                      while (pos < n) {
                          long long c = a + b;
                          int len = sprintf(buf, "%lld", c);
                          if (pos + len > n || strncmp(num + pos, buf, len) != 0) { ok = false; break; }
                          pos += len;
                          a = b;
                          b = c;
                      }
                      if (ok) return true;
                  }
              }
              return false;
          }
        `,
        csharp: code`
          public static bool IsAdditiveNumber(string num)
          {
              int n = num.Length;
              for (int i = 1; i < n; i++)
              {
                  if (num[0] == '0' && i > 1) break;
                  for (int j = 1; i + j < n; j++)
                  {
                      if (num[i] == '0' && j > 1) break;
                      if (Math.Max(i, j) > n - i - j) continue;
                      long a = long.Parse(num.Substring(0, i));
                      long b = long.Parse(num.Substring(i, j));
                      int pos = i + j;
                      bool ok = true;
                      while (pos < n)
                      {
                          long c = a + b;
                          string cs = c.ToString();
                          if (pos + cs.Length > n || num.Substring(pos, cs.Length) != cs) { ok = false; break; }
                          pos += cs.Length;
                          a = b;
                          b = c;
                      }
                      if (ok) return true;
                  }
              }
              return false;
          }
        `,
        go: code`
          func isAdditiveNumber(num string) bool {
          	n := len(num)
          	for i := 1; i < n; i++ {
          		if num[0] == '0' && i > 1 {
          			break
          		}
          		for j := 1; i+j < n; j++ {
          			if num[i] == '0' && j > 1 {
          				break
          			}
          			mx := i
          			if j > mx {
          				mx = j
          			}
          			if mx > n-i-j {
          				continue
          			}
          			a, _ := strconv.ParseInt(num[:i], 10, 64)
          			b, _ := strconv.ParseInt(num[i:i+j], 10, 64)
          			pos := i + j
          			ok := true
          			for pos < n {
          				c := a + b
          				cs := strconv.FormatInt(c, 10)
          				if !strings.HasPrefix(num[pos:], cs) {
          					ok = false
          					break
          				}
          				pos += len(cs)
          				a, b = b, c
          			}
          			if ok {
          				return true
          			}
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          fun isAdditiveNumber(num: String): Boolean {
              val n = num.length
              for (i in 1 until n) {
                  if (num[0] == '0' && i > 1) break
                  for (j in 1 until n - i) {
                      if (num[i] == '0' && j > 1) break
                      if (maxOf(i, j) > n - i - j) continue
                      var a = num.substring(0, i).toLong()
                      var b = num.substring(i, i + j).toLong()
                      var pos = i + j
                      var ok = true
                      while (pos < n) {
                          val c = a + b
                          val cs = c.toString()
                          if (!num.startsWith(cs, pos)) { ok = false; break }
                          pos += cs.length
                          a = b
                          b = c
                      }
                      if (ok) return true
                  }
              }
              return false
          }
        `,
        swift: code`
          func isAdditiveNumber(_ num: String) -> Bool {
              let d = Array(num.utf8).map { Int($0) - 48 }
              let n = d.count
              if n < 3 { return false }
              for i in 1..<n {
                  if d[0] == 0 && i > 1 { break }
                  var j = 1
                  while i + j < n {
                      if d[i] == 0 && j > 1 { break }
                      if max(i, j) > n - i - j { j += 1; continue }
                      var a = 0, b = 0
                      for k in 0..<i { a = a * 10 + d[k] }
                      for k in i..<(i + j) { b = b * 10 + d[k] }
                      var pos = i + j
                      var ok = true
                      while pos < n {
                          let c = a + b
                          let cs = Array(String(c).utf8).map { Int($0) - 48 }
                          if pos + cs.count > n || Array(d[pos..<(pos + cs.count)]) != cs { ok = false; break }
                          pos += cs.count
                          a = b
                          b = c
                      }
                      if ok { return true }
                      j += 1
                  }
              }
              return false
          }
        `,
        rust: code`
          fn isAdditiveNumber(num: String) -> bool {
              let d = num.as_bytes();
              let n = d.len();
              for i in 1..n {
                  if d[0] == b'0' && i > 1 {
                      break;
                  }
                  let mut j = 1;
                  while i + j < n {
                      if d[i] == b'0' && j > 1 {
                          break;
                      }
                      if std::cmp::max(i, j) > n - i - j {
                          j += 1;
                          continue;
                      }
                      let mut a: i64 = 0;
                      let mut b: i64 = 0;
                      for k in 0..i {
                          a = a * 10 + (d[k] - b'0') as i64;
                      }
                      for k in i..i + j {
                          b = b * 10 + (d[k] - b'0') as i64;
                      }
                      let mut pos = i + j;
                      let mut ok = true;
                      while pos < n {
                          let c = a + b;
                          let cs = c.to_string();
                          let cb = cs.as_bytes();
                          if pos + cb.len() > n || &d[pos..pos + cb.len()] != cb {
                              ok = false;
                              break;
                          }
                          pos += cb.len();
                          a = b;
                          b = c;
                      }
                      if ok {
                          return true;
                      }
                      j += 1;
                  }
              }
              false
          }
        `,
        php: code`
          function isAdditiveNumber($num) {
              $n = strlen($num);
              for ($i = 1; $i < $n; $i++) {
                  if ($num[0] === "0" && $i > 1) break;
                  for ($j = 1; $i + $j < $n; $j++) {
                      if ($num[$i] === "0" && $j > 1) break;
                      if (max($i, $j) > $n - $i - $j) continue;
                      $a = intval(substr($num, 0, $i));
                      $b = intval(substr($num, $i, $j));
                      $pos = $i + $j;
                      $ok = true;
                      while ($pos < $n) {
                          $c = $a + $b;
                          $cs = strval($c);
                          if (substr($num, $pos, strlen($cs)) !== $cs) { $ok = false; break; }
                          $pos += strlen($cs);
                          $a = $b;
                          $b = $c;
                      }
                      if ($ok) return true;
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def isAdditiveNumber(num)
            n = num.length
            (1...n).each do |i|
              break if num[0] == "0" && i > 1
              (1...(n - i)).each do |j|
                break if num[i] == "0" && j > 1
                next if [i, j].max > n - i - j
                a = num[0, i].to_i
                b = num[i, j].to_i
                pos = i + j
                ok = true
                while pos < n
                  c = a + b
                  cs = c.to_s
                  if num[pos, cs.length] != cs
                    ok = false
                    break
                  end
                  pos += cs.length
                  a = b
                  b = c
                end
                return true if ok
              end
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Optimal Division (LC 553) ───────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      if (n === 1) return String(nums[0]);
      if (n === 2) return `${nums[0]}/${nums[1]}`;
      // Sanity check against an interval DP over every parenthesisation.
      const hi: number[][] = [], lo: number[][] = [];
      for (let i = 0; i < n; i++) { hi.push(new Array(n).fill(0)); lo.push(new Array(n).fill(0)); hi[i][i] = lo[i][i] = nums[i]; }
      for (let len = 2; len <= n; len++) for (let i = 0; i + len - 1 < n; i++) {
        const j = i + len - 1;
        hi[i][j] = -Infinity; lo[i][j] = Infinity;
        for (let k = i; k < j; k++) {
          hi[i][j] = Math.max(hi[i][j], hi[i][k] / lo[k + 1][j]);
          lo[i][j] = Math.min(lo[i][j], lo[i][k] / hi[k + 1][j]);
        }
      }
      let formula = nums[0] / nums[1];
      for (let i = 2; i < n; i++) formula *= nums[i];
      if (Math.abs(formula - hi[0][n - 1]) > 1e-9 * hi[0][n - 1]) throw new Error("optimal-division formula mismatch");
      return `${nums[0]}/(${nums.slice(1).join("/")})`;
    };
    return {
      slug: "optimal-division",
      title: "Optimal Division",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "optimalDivision", params: [{ name: "nums", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "The integers of `nums` are written in order with a division sign between neighbours, for example `[8,2,4]` gives `8/2/4`, which is evaluated left to right as `(8/2)/4 = 1` using exact (real-number) division.\n\nYou may insert any number of pairs of parentheses to change the order of evaluation. Return the expression with the **largest** value, written as a string with the numbers in their original order, `/` between them, and **no redundant parentheses** (a pair that does not change the evaluation order must be left out). No spaces.\n\nThe inputs are such that this expression is unique.",
        [
          { in: "nums = [12,3,2]", out: '"12/(3/2)"', note: "`12/(3/2) = 8`, while `12/3/2 = 2`." },
          { in: "nums = [7,4]", out: '"7/4"' },
          { in: "nums = [25]", out: '"25"' },
        ],
        ["1 <= nums.length <= 10", "2 <= nums[i] <= 1000"]),
      hints: [
        "However you parenthesise, the first number is always in the numerator and the second always in the denominator.",
        "The best you can hope for is every other number in the numerator.",
        "`a/(b/c/d/…)` equals `a·c·d·…/b` — and it needs only one pair of parentheses.",
      ],
      editorial: explain({
        idea: "Since every number is at least 2, the value is maximised by dividing `nums[0]` by the smallest possible denominator, and `nums[1]/nums[2]/…/nums[n−1]` evaluated left to right is exactly that: it keeps only `nums[1]` in the denominator.",
        steps: [
          "If there is one number, return it.",
          "If there are two, return `a/b` — no parentheses can change it.",
          "Otherwise return `nums[0] + \"/(\" + nums[1..].join(\"/\") + \")\"`.",
        ],
        why: "In any parenthesisation `nums[0]` ends up in the numerator and `nums[1]` in the denominator (it is the first number to the right of the first division). The expression `a/(b/c/…/z)` simplifies to `a·c·…·z / b`, which puts every other number in the numerator — no expression can do better, and because every number is at least 2 this is a strict improvement whenever there are three or more numbers. The parentheses are not redundant (removing them gives `a/b/c/…`), and none inside are needed because left-to-right is already the order wanted. An interval DP over (max, min) pairs reaches the same value in O(n^3) — useful for checking, unnecessary for solving.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Two numbers must not get parentheses: `7/(4)` is redundant.",
          "Wrapping the whole tail in more parentheses, like `a/((b/c)/d)`, is redundant too.",
          "Building the DP is correct but over-engineered — the greedy form is provably optimal.",
        ],
      }),
      examples: [
        { input: "[12,3,2]", expectedOutput: "12/(3/2)" },
        { input: "[7,4]", expectedOutput: "7/4" },
        { input: "[25]", expectedOutput: "25" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, ri(rng, 3, 10), ri(rng, 3, 10)]);
        const hiV = pick(rng, [9, 100, 1000]);
        const nums = Array.from({ length: n }, () => ri(rng, 2, hiV));
        return { input: fmtIntArr(nums), expectedOutput: ref(nums) };
      },
      solutions: {
        python: code`
          from typing import List

          def optimalDivision(nums: List[int]) -> str:
              parts = [str(x) for x in nums]
              if len(parts) <= 2:
                  return "/".join(parts)
              return parts[0] + "/(" + "/".join(parts[1:]) + ")"
        `,
        javascript: code`
          var optimalDivision = function(nums) {
              if (nums.length <= 2) return nums.join("/");
              return nums[0] + "/(" + nums.slice(1).join("/") + ")";
          };
        `,
        typescript: code`
          function optimalDivision(nums: number[]): string {
              if (nums.length <= 2) return nums.join("/");
              return nums[0] + "/(" + nums.slice(1).join("/") + ")";
          }
        `,
        java: code`
          public static String optimalDivision(int[] nums) {
              StringBuilder sb = new StringBuilder();
              sb.append(nums[0]);
              if (nums.length == 1) return sb.toString();
              if (nums.length == 2) return sb.append('/').append(nums[1]).toString();
              sb.append("/(");
              for (int i = 1; i < nums.length; i++) {
                  if (i > 1) sb.append('/');
                  sb.append(nums[i]);
              }
              return sb.append(')').toString();
          }
        `,
        cpp: code`
          string optimalDivision(vector<int>& nums) {
              int n = (int)nums.size();
              string res = to_string(nums[0]);
              if (n == 1) return res;
              if (n == 2) return res + "/" + to_string(nums[1]);
              res += "/(";
              for (int i = 1; i < n; i++) {
                  if (i > 1) res += "/";
                  res += to_string(nums[i]);
              }
              return res + ")";
          }
        `,
        c: code`
          char* optimalDivision(int* nums, int numsSize) {
              char* res = (char*)malloc(16 * numsSize + 8);
              int p = sprintf(res, "%d", nums[0]);
              if (numsSize == 2) {
                  sprintf(res + p, "/%d", nums[1]);
              } else if (numsSize > 2) {
                  p += sprintf(res + p, "/(");
                  for (int i = 1; i < numsSize; i++) {
                      if (i > 1) res[p++] = '/';
                      p += sprintf(res + p, "%d", nums[i]);
                  }
                  sprintf(res + p, ")");
              }
              return res;
          }
        `,
        csharp: code`
          public static string OptimalDivision(int[] nums)
          {
              if (nums.Length <= 2) return string.Join("/", nums);
              return nums[0] + "/(" + string.Join("/", nums.Skip(1)) + ")";
          }
        `,
        go: code`
          func optimalDivision(nums []int) string {
          	parts := make([]string, len(nums))
          	for i, x := range nums {
          		parts[i] = fmt.Sprint(x)
          	}
          	if len(parts) <= 2 {
          		return strings.Join(parts, "/")
          	}
          	return parts[0] + "/(" + strings.Join(parts[1:], "/") + ")"
          }
        `,
        kotlin: code`
          fun optimalDivision(nums: IntArray): String {
              if (nums.size <= 2) return nums.joinToString("/")
              return "" + nums[0] + "/(" + nums.drop(1).joinToString("/") + ")"
          }
        `,
        swift: code`
          func optimalDivision(_ nums: [Int]) -> String {
              let parts = nums.map { String($0) }
              if parts.count <= 2 { return parts.joined(separator: "/") }
              return parts[0] + "/(" + parts[1...].joined(separator: "/") + ")"
          }
        `,
        rust: code`
          fn optimalDivision(nums: Vec<i32>) -> String {
              let parts: Vec<String> = nums.iter().map(|x| x.to_string()).collect();
              if parts.len() <= 2 {
                  return parts.join("/");
              }
              format!("{}/({})", parts[0], parts[1..].join("/"))
          }
        `,
        php: code`
          function optimalDivision($nums) {
              if (count($nums) <= 2) return implode("/", $nums);
              return $nums[0] . "/(" . implode("/", array_slice($nums, 1)) . ")";
          }
        `,
        ruby: code`
          def optimalDivision(nums)
            return nums.join("/") if nums.length <= 2
            "#{nums[0]}/(#{nums[1..-1].join("/")})"
          end
        `,
      },
    };
  })(),

  // ── Complex Number Multiplication (LC 537) ──────────────────────
  (() => {
    const parse = (s: string) => {
      const m = /^(-?\d+)\+(-?\d+)i$/.exec(s)!;
      return [Number(m[1]), Number(m[2])];
    };
    const ref = (num1: string, num2: string) => {
      const [a, b] = parse(num1), [c, d] = parse(num2);
      return `${a * c - b * d}+${a * d + b * c}i`;
    };
    const fmt = (re: number, im: number) => `${re}+${im}i`;
    return {
      slug: "complex-number-multiplication",
      title: "Complex Number Multiplication",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Simulation", "Amazon", "Apple"],
      signature: { funcName: "complexNumberMultiply", params: [{ name: "num1", type: "string" as const }, { name: "num2", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A complex number is written as `\"real+imaginaryi\"`, where `real` and `imaginary` are integers (a negative one keeps its minus sign, so `1 − 4i` is written `\"1+-4i\"`), and `i² = −1`.\n\nGiven two complex numbers `num1` and `num2` in that format, return their product in the same format: the real part, a `+`, the imaginary part, and a trailing `i` — even when a part is zero or negative.",
        [
          { in: "num1 = \"3+2i\", num2 = \"1+-4i\"", out: '"11+-10i"', note: "(3 + 2i)(1 − 4i) = 3 − 12i + 2i − 8i² = 11 − 10i." },
          { in: "num1 = \"-2+3i\", num2 = \"4+-1i\"", out: '"-5+14i"' },
          { in: "num1 = \"0+0i\", num2 = \"-5+7i\"", out: '"0+0i"' },
        ],
        ["num1 and num2 are valid complex numbers in the format above", "-100 <= real, imaginary <= 100"]),
      hints: [
        "Split each string at the `+`: the part before is the real part, the part after (without the trailing `i`) is the imaginary part.",
        "The real part never contains a `+`, so the first `+` is always the separator.",
        "(a + bi)(c + di) = (ac − bd) + (ad + bc)i.",
      ],
      editorial: explain({
        idea: "Parse the two integer parts of each number, apply the product rule with `i² = −1`, and print the parts back in the same format.",
        steps: [
          "Find the `+` in each string; parse the text before it as `a` (or `c`) and the text between it and the final `i` as `b` (or `d`).",
          "Compute `real = a·c − b·d` and `imag = a·d + b·c`.",
          "Return `real + \"+\" + imag + \"i\"`.",
        ],
        why: "Expanding (a + bi)(c + di) gives ac + adi + bci + bdi²; since i² = −1 the last term is real, which yields the two formulas. With parts in [−100, 100] the results stay within ±20 000, so ordinary integers are fine.",
        time: "O(1) — the strings have constant length",
        space: "O(1)",
        pitfalls: [
          "A negative imaginary part is printed as `+-`, never as a bare `-`.",
          "Splitting on `-` breaks for negative real parts; split on `+` instead.",
          "Forgetting the minus sign from `i² = −1` makes the real part `ac + bd`.",
        ],
      }),
      examples: [
        { input: '"3+2i"\n"1+-4i"', expectedOutput: "11+-10i" },
        { input: '"-2+3i"\n"4+-1i"', expectedOutput: "-5+14i" },
        { input: '"0+0i"\n"-5+7i"', expectedOutput: "0+0i" },
      ],
      gen: (rng: Rng) => {
        const part = () => pick(rng, [0, ri(rng, -9, 9), ri(rng, -100, 100), ri(rng, -100, 100), pick(rng, [-100, 100])]);
        const num1 = fmt(part(), part()), num2 = fmt(part(), part());
        return { input: `"${num1}"\n"${num2}"`, expectedOutput: ref(num1, num2) };
      },
      solutions: {
        python: code`
          def complexNumberMultiply(num1: str, num2: str) -> str:
              a, b = num1[:-1].split("+")
              c, d = num2[:-1].split("+")
              a, b, c, d = int(a), int(b), int(c), int(d)
              return str(a * c - b * d) + "+" + str(a * d + b * c) + "i"
        `,
        javascript: code`
          var complexNumberMultiply = function(num1, num2) {
              var p = num1.indexOf("+"), q = num2.indexOf("+");
              var a = parseInt(num1.substring(0, p), 10), b = parseInt(num1.substring(p + 1, num1.length - 1), 10);
              var c = parseInt(num2.substring(0, q), 10), d = parseInt(num2.substring(q + 1, num2.length - 1), 10);
              return (a * c - b * d) + "+" + (a * d + b * c) + "i";
          };
        `,
        typescript: code`
          function complexNumberMultiply(num1: string, num2: string): string {
              var p = num1.indexOf("+"), q = num2.indexOf("+");
              var a = parseInt(num1.substring(0, p), 10), b = parseInt(num1.substring(p + 1, num1.length - 1), 10);
              var c = parseInt(num2.substring(0, q), 10), d = parseInt(num2.substring(q + 1, num2.length - 1), 10);
              return (a * c - b * d) + "+" + (a * d + b * c) + "i";
          }
        `,
        java: code`
          public static String complexNumberMultiply(String num1, String num2) {
              int p = num1.indexOf('+'), q = num2.indexOf('+');
              int a = Integer.parseInt(num1.substring(0, p)), b = Integer.parseInt(num1.substring(p + 1, num1.length() - 1));
              int c = Integer.parseInt(num2.substring(0, q)), d = Integer.parseInt(num2.substring(q + 1, num2.length() - 1));
              return (a * c - b * d) + "+" + (a * d + b * c) + "i";
          }
        `,
        cpp: code`
          string complexNumberMultiply(string num1, string num2) {
              size_t p = num1.find('+'), q = num2.find('+');
              int a = stoi(num1.substr(0, p)), b = stoi(num1.substr(p + 1, num1.size() - p - 2));
              int c = stoi(num2.substr(0, q)), d = stoi(num2.substr(q + 1, num2.size() - q - 2));
              return to_string(a * c - b * d) + "+" + to_string(a * d + b * c) + "i";
          }
        `,
        c: code`
          static void cxParse(const char* s, int* re, int* im) {
              int i = 0, sign = 1, v = 0;
              if (s[i] == '-') { sign = -1; i++; }
              while (s[i] != '+') { v = v * 10 + (s[i] - '0'); i++; }
              *re = sign * v;
              i++;
              sign = 1;
              v = 0;
              if (s[i] == '-') { sign = -1; i++; }
              while (s[i] != 'i') { v = v * 10 + (s[i] - '0'); i++; }
              *im = sign * v;
          }

          char* complexNumberMultiply(const char* num1, const char* num2) {
              int a, b, c, d;
              cxParse(num1, &a, &b);
              cxParse(num2, &c, &d);
              char* res = (char*)malloc(32);
              sprintf(res, "%d+%di", a * c - b * d, a * d + b * c);
              return res;
          }
        `,
        csharp: code`
          public static string ComplexNumberMultiply(string num1, string num2)
          {
              int p = num1.IndexOf('+'), q = num2.IndexOf('+');
              int a = int.Parse(num1.Substring(0, p)), b = int.Parse(num1.Substring(p + 1, num1.Length - p - 2));
              int c = int.Parse(num2.Substring(0, q)), d = int.Parse(num2.Substring(q + 1, num2.Length - q - 2));
              return (a * c - b * d) + "+" + (a * d + b * c) + "i";
          }
        `,
        go: code`
          func complexNumberMultiply(num1 string, num2 string) string {
          	p := strings.Index(num1, "+")
          	q := strings.Index(num2, "+")
          	a, _ := strconv.Atoi(num1[:p])
          	b, _ := strconv.Atoi(num1[p+1 : len(num1)-1])
          	c, _ := strconv.Atoi(num2[:q])
          	d, _ := strconv.Atoi(num2[q+1 : len(num2)-1])
          	return fmt.Sprintf("%d+%di", a*c-b*d, a*d+b*c)
          }
        `,
        kotlin: code`
          fun complexNumberMultiply(num1: String, num2: String): String {
              val p = num1.indexOf('+')
              val q = num2.indexOf('+')
              val a = num1.substring(0, p).toInt()
              val b = num1.substring(p + 1, num1.length - 1).toInt()
              val c = num2.substring(0, q).toInt()
              val d = num2.substring(q + 1, num2.length - 1).toInt()
              return "" + (a * c - b * d) + "+" + (a * d + b * c) + "i"
          }
        `,
        swift: code`
          func complexNumberMultiply(_ num1: String, _ num2: String) -> String {
              func parts(_ s: String) -> (Int, Int) {
                  let body = String(s.dropLast())
                  let pieces = body.split(separator: "+", maxSplits: 1, omittingEmptySubsequences: false)
                  return (Int(String(pieces[0]))!, Int(String(pieces[1]))!)
              }
              let (a, b) = parts(num1)
              let (c, d) = parts(num2)
              return "\(a * c - b * d)+\(a * d + b * c)i"
          }
        `,
        rust: code`
          fn complexNumberMultiply(num1: String, num2: String) -> String {
              fn parts(s: &str) -> (i32, i32) {
                  let p = s.find('+').unwrap();
                  let re: i32 = s[..p].parse().unwrap();
                  let im: i32 = s[p + 1..s.len() - 1].parse().unwrap();
                  (re, im)
              }
              let (a, b) = parts(&num1);
              let (c, d) = parts(&num2);
              format!("{}+{}i", a * c - b * d, a * d + b * c)
          }
        `,
        php: code`
          function complexNumberMultiply($num1, $num2) {
              $x = explode("+", substr($num1, 0, -1));
              $y = explode("+", substr($num2, 0, -1));
              $a = intval($x[0]);
              $b = intval($x[1]);
              $c = intval($y[0]);
              $d = intval($y[1]);
              return ($a * $c - $b * $d) . "+" . ($a * $d + $b * $c) . "i";
          }
        `,
        ruby: code`
          def complexNumberMultiply(num1, num2)
            a, b = num1.chomp("i").split("+").map(&:to_i)
            c, d = num2.chomp("i").split("+").map(&:to_i)
            "#{a * c - b * d}+#{a * d + b * c}i"
          end
        `,
      },
    };
  })(),

  // ── Minimum Time Difference (LC 539) ────────────────────────────
  (() => {
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const ref = (timePoints: string[]) => {
      let best = Infinity;
      for (let i = 0; i < timePoints.length; i++) for (let j = i + 1; j < timePoints.length; j++) {
        const d = Math.abs(toMin(timePoints[i]) - toMin(timePoints[j]));
        best = Math.min(best, d, 1440 - d);
      }
      return best;
    };
    const fmtT = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    return {
      slug: "minimum-time-difference",
      title: "Minimum Time Difference",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "String", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "findMinDifference", params: [{ name: "timePoints", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a list of clock times on a 24-hour clock, each written `\"HH:MM\"` (`00:00` to `23:59`). The clock wraps around: `23:59` and `00:00` are one minute apart.\n\nReturn the smallest difference, in minutes, between any two of the times. Equal times are 0 minutes apart.",
        [
          { in: "timePoints = [\"09:30\",\"23:55\",\"00:10\"]", out: "15", note: "From 23:55 to 00:10 is 15 minutes across midnight." },
          { in: "timePoints = [\"12:00\",\"18:45\",\"12:00\"]", out: "0" },
          { in: "timePoints = [\"00:00\",\"12:00\"]", out: "720" },
        ],
        ["2 <= timePoints.length <= 2 * 10^4", "timePoints[i] is in the format \"HH:MM\""]),
      hints: [
        "Convert every time to minutes after midnight.",
        "After sorting, the closest pair is always adjacent — except that the last and first times are also neighbours across midnight.",
        "There are only 1440 distinct minutes: with more times than that a duplicate is guaranteed, and a 1440-slot bucket replaces the sort.",
      ],
      editorial: explain({
        idea: "On a circle of 1440 minutes the closest pair of points are neighbours in sorted order, with the last point also neighbouring the first through midnight.",
        steps: [
          "Mark each time's minute `60·HH + MM` in an array of 1440 slots; if a slot is already marked, return 0.",
          "Walk the slots in order, remembering the first and the previous marked minute; for each marked minute, update the answer with its distance to the previous one.",
          "Finally update the answer with the wrap-around gap `first + 1440 − last`.",
        ],
        why: "For two non-adjacent sorted minutes some marked minute lies between them on the shorter arc, which makes one of the adjacent gaps no larger, so checking adjacent gaps (including the wrap-around one) suffices. The circular distance between neighbours `x < y` is `min(y − x, 1440 − (y − x))`, and the adjacent gaps around the circle sum to 1440, so whichever direction is shorter appears as one of those gaps.",
        time: "O(n + 1440)",
        space: "O(1440)",
        pitfalls: [
          "Forgetting the gap across midnight (`23:55` → `00:10`).",
          "Duplicate times give 0 — the bucket approach detects them immediately.",
          "Comparing the strings directly instead of converting to minutes.",
        ],
      }),
      examples: [
        { input: '["09:30","23:55","00:10"]', expectedOutput: "15" },
        { input: '["12:00","18:45","12:00"]', expectedOutput: "0" },
        { input: '["00:00","12:00"]', expectedOutput: "720" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 2, ri(rng, 3, 6), ri(rng, 3, 25)]);
        const mode = ri(rng, 0, 3);
        const mins: number[] = [];
        for (let i = 0; i < n; i++) {
          if (mode === 0) mins.push(pick(rng, [ri(rng, 0, 15), ri(rng, 1425, 1439), ri(rng, 0, 1439)]));
          else if (mode === 1) mins.push(ri(rng, 0, 1439));
          else if (mode === 2) mins.push(ri(rng, 0, 23) * 60);
          else mins.push(ri(rng, 600, 660));
        }
        const tp = mins.map(fmtT);
        return { input: fmtStrArr(tp), expectedOutput: String(ref(tp)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findMinDifference(timePoints: List[str]) -> int:
              seen = [False] * 1440
              for t in timePoints:
                  m = int(t[:2]) * 60 + int(t[3:])
                  if seen[m]:
                      return 0
                  seen[m] = True
              first = prev = -1
              best = 1440
              for m in range(1440):
                  if seen[m]:
                      if prev >= 0:
                          best = min(best, m - prev)
                      else:
                          first = m
                      prev = m
              return min(best, first + 1440 - prev)
        `,
        javascript: code`
          var findMinDifference = function(timePoints) {
              var seen = new Array(1440);
              for (var i = 0; i < timePoints.length; i++) {
                  var t = timePoints[i];
                  var m = parseInt(t.substring(0, 2), 10) * 60 + parseInt(t.substring(3), 10);
                  if (seen[m]) return 0;
                  seen[m] = true;
              }
              var first = -1, prev = -1, best = 1440;
              for (var m2 = 0; m2 < 1440; m2++) {
                  if (!seen[m2]) continue;
                  if (prev >= 0) best = Math.min(best, m2 - prev);
                  else first = m2;
                  prev = m2;
              }
              return Math.min(best, first + 1440 - prev);
          };
        `,
        typescript: code`
          function findMinDifference(timePoints: string[]): number {
              var seen: boolean[] = [];
              for (var k = 0; k < 1440; k++) seen.push(false);
              for (var i = 0; i < timePoints.length; i++) {
                  var t = timePoints[i];
                  var m = parseInt(t.substring(0, 2), 10) * 60 + parseInt(t.substring(3), 10);
                  if (seen[m]) return 0;
                  seen[m] = true;
              }
              var first = -1, prev = -1, best = 1440;
              for (var m2 = 0; m2 < 1440; m2++) {
                  if (!seen[m2]) continue;
                  if (prev >= 0) best = Math.min(best, m2 - prev);
                  else first = m2;
                  prev = m2;
              }
              return Math.min(best, first + 1440 - prev);
          }
        `,
        java: code`
          public static int findMinDifference(String[] timePoints) {
              boolean[] seen = new boolean[1440];
              for (String t : timePoints) {
                  int m = Integer.parseInt(t.substring(0, 2)) * 60 + Integer.parseInt(t.substring(3));
                  if (seen[m]) return 0;
                  seen[m] = true;
              }
              int first = -1, prev = -1, best = 1440;
              for (int m = 0; m < 1440; m++) {
                  if (!seen[m]) continue;
                  if (prev >= 0) best = Math.min(best, m - prev);
                  else first = m;
                  prev = m;
              }
              return Math.min(best, first + 1440 - prev);
          }
        `,
        cpp: code`
          int findMinDifference(vector<string>& timePoints) {
              vector<bool> seen(1440, false);
              for (const string& t : timePoints) {
                  int m = stoi(t.substr(0, 2)) * 60 + stoi(t.substr(3));
                  if (seen[m]) return 0;
                  seen[m] = true;
              }
              int first = -1, prev = -1, best = 1440;
              for (int m = 0; m < 1440; m++) {
                  if (!seen[m]) continue;
                  if (prev >= 0) best = min(best, m - prev);
                  else first = m;
                  prev = m;
              }
              return min(best, first + 1440 - prev);
          }
        `,
        c: code`
          int findMinDifference(char** timePoints, int timePointsSize) {
              char seen[1440];
              memset(seen, 0, sizeof(seen));
              for (int i = 0; i < timePointsSize; i++) {
                  const char* t = timePoints[i];
                  int m = ((t[0] - '0') * 10 + (t[1] - '0')) * 60 + (t[3] - '0') * 10 + (t[4] - '0');
                  if (seen[m]) return 0;
                  seen[m] = 1;
              }
              int first = -1, prev = -1, best = 1440;
              for (int m = 0; m < 1440; m++) {
                  if (!seen[m]) continue;
                  if (prev >= 0 && m - prev < best) best = m - prev;
                  if (prev < 0) first = m;
                  prev = m;
              }
              if (first + 1440 - prev < best) best = first + 1440 - prev;
              return best;
          }
        `,
        csharp: code`
          public static int FindMinDifference(string[] timePoints)
          {
              var seen = new bool[1440];
              foreach (var t in timePoints)
              {
                  int m = int.Parse(t.Substring(0, 2)) * 60 + int.Parse(t.Substring(3));
                  if (seen[m]) return 0;
                  seen[m] = true;
              }
              int first = -1, prev = -1, best = 1440;
              for (int m = 0; m < 1440; m++)
              {
                  if (!seen[m]) continue;
                  if (prev >= 0) best = Math.Min(best, m - prev);
                  else first = m;
                  prev = m;
              }
              return Math.Min(best, first + 1440 - prev);
          }
        `,
        go: code`
          func findMinDifference(timePoints []string) int {
          	var seen [1440]bool
          	for _, t := range timePoints {
          		m := (int(t[0]-'0')*10+int(t[1]-'0'))*60 + int(t[3]-'0')*10 + int(t[4]-'0')
          		if seen[m] {
          			return 0
          		}
          		seen[m] = true
          	}
          	first, prev, best := -1, -1, 1440
          	for m := 0; m < 1440; m++ {
          		if !seen[m] {
          			continue
          		}
          		if prev >= 0 {
          			if m-prev < best {
          				best = m - prev
          			}
          		} else {
          			first = m
          		}
          		prev = m
          	}
          	if first+1440-prev < best {
          		best = first + 1440 - prev
          	}
          	return best
          }
        `,
        kotlin: code`
          fun findMinDifference(timePoints: Array<String>): Int {
              val seen = BooleanArray(1440)
              for (t in timePoints) {
                  val m = t.substring(0, 2).toInt() * 60 + t.substring(3).toInt()
                  if (seen[m]) return 0
                  seen[m] = true
              }
              var first = -1
              var prev = -1
              var best = 1440
              for (m in 0 until 1440) {
                  if (!seen[m]) continue
                  if (prev >= 0) best = minOf(best, m - prev) else first = m
                  prev = m
              }
              return minOf(best, first + 1440 - prev)
          }
        `,
        swift: code`
          func findMinDifference(_ timePoints: [String]) -> Int {
              var seen = [Bool](repeating: false, count: 1440)
              for t in timePoints {
                  let d = Array(t.utf8).map { Int($0) - 48 }
                  let m = (d[0] * 10 + d[1]) * 60 + d[3] * 10 + d[4]
                  if seen[m] { return 0 }
                  seen[m] = true
              }
              var first = -1, prev = -1, best = 1440
              for m in 0..<1440 where seen[m] {
                  if prev >= 0 { best = min(best, m - prev) } else { first = m }
                  prev = m
              }
              return min(best, first + 1440 - prev)
          }
        `,
        rust: code`
          fn findMinDifference(timePoints: Vec<String>) -> i32 {
              let mut seen = vec![false; 1440];
              for t in timePoints.iter() {
                  let d = t.as_bytes();
                  let m = ((d[0] - b'0') as usize * 10 + (d[1] - b'0') as usize) * 60
                      + (d[3] - b'0') as usize * 10
                      + (d[4] - b'0') as usize;
                  if seen[m] {
                      return 0;
                  }
                  seen[m] = true;
              }
              let mut first: i32 = -1;
              let mut prev: i32 = -1;
              let mut best: i32 = 1440;
              for m in 0..1440i32 {
                  if !seen[m as usize] {
                      continue;
                  }
                  if prev >= 0 {
                      best = std::cmp::min(best, m - prev);
                  } else {
                      first = m;
                  }
                  prev = m;
              }
              std::cmp::min(best, first + 1440 - prev)
          }
        `,
        php: code`
          function findMinDifference($timePoints) {
              $seen = array_fill(0, 1440, false);
              foreach ($timePoints as $t) {
                  $m = intval(substr($t, 0, 2)) * 60 + intval(substr($t, 3, 2));
                  if ($seen[$m]) return 0;
                  $seen[$m] = true;
              }
              $first = -1;
              $prev = -1;
              $best = 1440;
              for ($m = 0; $m < 1440; $m++) {
                  if (!$seen[$m]) continue;
                  if ($prev >= 0) $best = min($best, $m - $prev);
                  else $first = $m;
                  $prev = $m;
              }
              return min($best, $first + 1440 - $prev);
          }
        `,
        ruby: code`
          def findMinDifference(timePoints)
            seen = Array.new(1440, false)
            timePoints.each do |t|
              m = t[0, 2].to_i * 60 + t[3, 2].to_i
              return 0 if seen[m]
              seen[m] = true
            end
            first = -1
            prev = -1
            best = 1440
            1440.times do |m|
              next unless seen[m]
              if prev >= 0
                best = [best, m - prev].min
              else
                first = m
              end
              prev = m
            end
            [best, first + 1440 - prev].min
          end
        `,
      },
    };
  })(),

  // ── Expressive Words (LC 809) ───────────────────────────────────
  (() => {
    const groups = (t: string) => (t.match(/(.)\1*/g) || []).map((g) => [g[0], g.length] as [string, number]);
    const stretchy = (s: string, w: string) => {
      const a = groups(s), b = groups(w);
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i][0] !== b[i][0]) return false;
        const x = a[i][1], y = b[i][1];
        if (x < y || (x !== y && x < 3)) return false;
      }
      return true;
    };
    const ref = (s: string, words: string[]) => words.filter((w) => stretchy(s, w)).length;
    return {
      slug: "expressive-words",
      title: "Expressive Words",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "String", "Google", "Amazon"],
      signature: { funcName: "expressiveWords", params: [{ name: "s", type: "string" as const }, { name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "People stretch words for emphasis: `\"hello\"` becomes `\"heeellooo\"`. A **group** is a maximal run of the same letter, so `\"heeellooo\"` has the groups `h`, `eee`, `ll`, `ooo`.\n\nA word can be **stretched** into `s` when `s` is obtained by repeatedly choosing a group of the word and adding copies of its letter, so that the group ends up with **at least 3** letters. A group may also be left as it is.\n\nGiven `s` and a list of query `words`, return how many of the words can be stretched into `s`.",
        [
          { in: "s = \"kaaaiirooo\", words = [\"kairo\",\"kaiiro\",\"kaaiirooo\",\"kair\"]", out: "2", note: "`kaiiro` and `kaaiirooo` work. `kairo` would need its `i` group grown to exactly 2, which is not allowed; `kair` has no `o` group." },
          { in: "s = \"zzzyyy\", words = [\"zy\",\"zzy\",\"zyyyy\"]", out: "2", note: "`zyyyy` has four `y`s, more than `s` has." },
          { in: "s = \"abc\", words = [\"abc\",\"ab\",\"abcc\"]", out: "1" },
        ],
        ["1 <= s.length, words.length <= 100", "1 <= words[i].length <= 100", "s and words[i] consist of lowercase English letters"]),
      hints: [
        "Compare `s` and a word group by group: the letters of the groups must agree one for one.",
        "For a group of length `a` in `s` and `b` in the word: equal lengths are fine; otherwise the word's group must be shorter and the stretched one must reach 3.",
        "Walk both strings with two pointers, measuring each group's length as you go.",
      ],
      editorial: explain({
        idea: "Stretching never changes the sequence of group letters, only group lengths, so a word works exactly when its groups line up with those of `s` and each length change is a legal stretch.",
        steps: [
          "For each word, keep pointers `i` into `s` and `j` into the word.",
          "While both are inside their strings: if `s[i] != word[j]` the word fails; otherwise count the run length `a` of that letter in `s` and `b` in the word, advancing both pointers past their runs.",
          "The group is fine if `a == b`, or if `a >= 3` and `a > b`; otherwise the word fails.",
          "The word succeeds if both pointers reach their ends together. Count the successes.",
        ],
        why: "Each stretch operation turns one group of length `b` into length `a ≥ 3` with `a > b`, and leaves every other group alone; groups never merge or split because only copies of the same letter are added. So `s` is reachable exactly when the group letters match in order and every group either keeps its length or grows to at least 3 — which is what the check tests.",
        time: "O(|s| · |words| + total length of the words)",
        space: "O(1)",
        pitfalls: [
          "A group of length 2 in `s` can only match a group of length exactly 2 — stretching must reach at least 3.",
          "A word's group longer than the matching group of `s` fails; letters are never removed.",
          "Check that both strings are fully consumed; an extra trailing group on either side fails.",
        ],
      }),
      examples: [
        { input: '"kaaaiirooo"\n["kairo","kaiiro","kaaiirooo","kair"]', expectedOutput: "2" },
        { input: '"zzzyyy"\n["zy","zzy","zyyyy"]', expectedOutput: "2" },
        { input: '"abc"\n["abc","ab","abcc"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "xyz", "abcdefgh"]);
        const g = ri(rng, 1, 6);
        const base: Array<[string, number]> = [];
        for (let i = 0; i < g; i++) {
          let c = alpha[ri(rng, 0, alpha.length - 1)];
          if (base.length && base[base.length - 1][0] === c) c = c === alpha[0] ? alpha[1] : alpha[0];
          base.push([c, pick(rng, [1, 1, 2, 3, ri(rng, 1, 5)])]);
        }
        const sGroups = base.map(([c, len]) => [c, rng() < 0.6 ? Math.max(len, ri(rng, 3, 6)) : len] as [string, number]);
        const s = sGroups.map(([c, len]) => c.repeat(len)).join("");
        const words: string[] = [];
        const k = ri(rng, 1, 7);
        for (let i = 0; i < k; i++) {
          const mode = ri(rng, 0, 5);
          if (mode <= 2) {
            // Shrink some groups of s — valid when every shrunk group had length >= 3.
            words.push(sGroups.map(([c, len]) => c.repeat(rng() < 0.5 ? ri(rng, 1, len) : len)).join(""));
          } else if (mode === 3) {
            words.push(base.map(([c, len]) => c.repeat(len)).join(""));
          } else if (mode === 4) {
            const w = sGroups.map(([c, len]) => c.repeat(ri(rng, 1, len + 1))).join("");
            words.push(rng() < 0.5 ? w + alpha[ri(rng, 0, alpha.length - 1)] : w);
          } else {
            words.push(randLower(rng, 1, 8, alpha));
          }
        }
        return { input: `"${s}"\n${fmtStrArr(words)}`, expectedOutput: String(ref(s, words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def expressiveWords(s: str, words: List[str]) -> int:
              def stretchy(w):
                  i = j = 0
                  while i < len(s) and j < len(w):
                      if s[i] != w[j]:
                          return False
                      c = s[i]
                      a = b = 0
                      while i < len(s) and s[i] == c:
                          i += 1
                          a += 1
                      while j < len(w) and w[j] == c:
                          j += 1
                          b += 1
                      if a < b or (a != b and a < 3):
                          return False
                  return i == len(s) and j == len(w)

              return sum(1 for w in words if stretchy(w))
        `,
        javascript: code`
          var expressiveWords = function(s, words) {
              var stretchy = function(w) {
                  var i = 0, j = 0;
                  while (i < s.length && j < w.length) {
                      if (s[i] !== w[j]) return false;
                      var c = s[i], a = 0, b = 0;
                      while (i < s.length && s[i] === c) { i++; a++; }
                      while (j < w.length && w[j] === c) { j++; b++; }
                      if (a < b || (a !== b && a < 3)) return false;
                  }
                  return i === s.length && j === w.length;
              };
              var count = 0;
              for (var k = 0; k < words.length; k++) if (stretchy(words[k])) count++;
              return count;
          };
        `,
        typescript: code`
          function expressiveWords(s: string, words: string[]): number {
              var stretchy = function(w: string): boolean {
                  var i = 0, j = 0;
                  while (i < s.length && j < w.length) {
                      if (s.charAt(i) !== w.charAt(j)) return false;
                      var c = s.charAt(i), a = 0, b = 0;
                      while (i < s.length && s.charAt(i) === c) { i++; a++; }
                      while (j < w.length && w.charAt(j) === c) { j++; b++; }
                      if (a < b || (a !== b && a < 3)) return false;
                  }
                  return i === s.length && j === w.length;
              };
              var count = 0;
              for (var k = 0; k < words.length; k++) if (stretchy(words[k])) count++;
              return count;
          }
        `,
        java: code`
          public static int expressiveWords(String s, String[] words) {
              int count = 0;
              for (String w : words) if (stretchy(s, w)) count++;
              return count;
          }

          static boolean stretchy(String s, String w) {
              int i = 0, j = 0;
              while (i < s.length() && j < w.length()) {
                  if (s.charAt(i) != w.charAt(j)) return false;
                  char c = s.charAt(i);
                  int a = 0, b = 0;
                  while (i < s.length() && s.charAt(i) == c) { i++; a++; }
                  while (j < w.length() && w.charAt(j) == c) { j++; b++; }
                  if (a < b || (a != b && a < 3)) return false;
              }
              return i == s.length() && j == w.length();
          }
        `,
        cpp: code`
          bool stretchy(const string& s, const string& w) {
              size_t i = 0, j = 0;
              while (i < s.size() && j < w.size()) {
                  if (s[i] != w[j]) return false;
                  char c = s[i];
                  int a = 0, b = 0;
                  while (i < s.size() && s[i] == c) { i++; a++; }
                  while (j < w.size() && w[j] == c) { j++; b++; }
                  if (a < b || (a != b && a < 3)) return false;
              }
              return i == s.size() && j == w.size();
          }

          int expressiveWords(string s, vector<string>& words) {
              int count = 0;
              for (const string& w : words) if (stretchy(s, w)) count++;
              return count;
          }
        `,
        c: code`
          static bool stretchy(const char* s, const char* w) {
              int i = 0, j = 0;
              while (s[i] != '\0' && w[j] != '\0') {
                  if (s[i] != w[j]) return false;
                  char c = s[i];
                  int a = 0, b = 0;
                  while (s[i] == c) { i++; a++; }
                  while (w[j] == c) { j++; b++; }
                  if (a < b || (a != b && a < 3)) return false;
              }
              return s[i] == '\0' && w[j] == '\0';
          }

          int expressiveWords(const char* s, char** words, int wordsSize) {
              int count = 0;
              for (int k = 0; k < wordsSize; k++) if (stretchy(s, words[k])) count++;
              return count;
          }
        `,
        csharp: code`
          public static int ExpressiveWords(string s, string[] words)
          {
              int count = 0;
              foreach (var w in words) if (Stretchy(s, w)) count++;
              return count;
          }

          static bool Stretchy(string s, string w)
          {
              int i = 0, j = 0;
              while (i < s.Length && j < w.Length)
              {
                  if (s[i] != w[j]) return false;
                  char c = s[i];
                  int a = 0, b = 0;
                  while (i < s.Length && s[i] == c) { i++; a++; }
                  while (j < w.Length && w[j] == c) { j++; b++; }
                  if (a < b || (a != b && a < 3)) return false;
              }
              return i == s.Length && j == w.Length;
          }
        `,
        go: code`
          func expressiveWords(s string, words []string) int {
          	count := 0
          	for _, w := range words {
          		if stretchy(s, w) {
          			count++
          		}
          	}
          	return count
          }

          func stretchy(s, w string) bool {
          	i, j := 0, 0
          	for i < len(s) && j < len(w) {
          		if s[i] != w[j] {
          			return false
          		}
          		c := s[i]
          		a, b := 0, 0
          		for i < len(s) && s[i] == c {
          			i++
          			a++
          		}
          		for j < len(w) && w[j] == c {
          			j++
          			b++
          		}
          		if a < b || (a != b && a < 3) {
          			return false
          		}
          	}
          	return i == len(s) && j == len(w)
          }
        `,
        kotlin: code`
          fun expressiveWords(s: String, words: Array<String>): Int {
              return words.count { stretchy(s, it) }
          }

          fun stretchy(s: String, w: String): Boolean {
              var i = 0
              var j = 0
              while (i < s.length && j < w.length) {
                  if (s[i] != w[j]) return false
                  val c = s[i]
                  var a = 0
                  var b = 0
                  while (i < s.length && s[i] == c) { i++; a++ }
                  while (j < w.length && w[j] == c) { j++; b++ }
                  if (a < b || (a != b && a < 3)) return false
              }
              return i == s.length && j == w.length
          }
        `,
        swift: code`
          func expressiveWords(_ s: String, _ words: [String]) -> Int {
              let sa = Array(s.utf8)
              var count = 0
              for word in words {
                  let w = Array(word.utf8)
                  var i = 0, j = 0
                  var ok = true
                  while i < sa.count && j < w.count {
                      if sa[i] != w[j] { ok = false; break }
                      let c = sa[i]
                      var a = 0, b = 0
                      while i < sa.count && sa[i] == c { i += 1; a += 1 }
                      while j < w.count && w[j] == c { j += 1; b += 1 }
                      if a < b || (a != b && a < 3) { ok = false; break }
                  }
                  if ok && i == sa.count && j == w.count { count += 1 }
              }
              return count
          }
        `,
        rust: code`
          fn expressiveWords(s: String, words: Vec<String>) -> i32 {
              let sa = s.as_bytes();
              let mut count = 0;
              for word in words.iter() {
                  let w = word.as_bytes();
                  let (mut i, mut j) = (0usize, 0usize);
                  let mut ok = true;
                  while i < sa.len() && j < w.len() {
                      if sa[i] != w[j] {
                          ok = false;
                          break;
                      }
                      let c = sa[i];
                      let (mut a, mut b) = (0, 0);
                      while i < sa.len() && sa[i] == c {
                          i += 1;
                          a += 1;
                      }
                      while j < w.len() && w[j] == c {
                          j += 1;
                          b += 1;
                      }
                      if a < b || (a != b && a < 3) {
                          ok = false;
                          break;
                      }
                  }
                  if ok && i == sa.len() && j == w.len() {
                      count += 1;
                  }
              }
              count
          }
        `,
        php: code`
          function expressiveWords($s, $words) {
              $count = 0;
              foreach ($words as $w) if (stretchy($s, $w)) $count++;
              return $count;
          }

          function stretchy($s, $w) {
              $i = 0;
              $j = 0;
              $n = strlen($s);
              $m = strlen($w);
              while ($i < $n && $j < $m) {
                  if ($s[$i] !== $w[$j]) return false;
                  $c = $s[$i];
                  $a = 0;
                  $b = 0;
                  while ($i < $n && $s[$i] === $c) { $i++; $a++; }
                  while ($j < $m && $w[$j] === $c) { $j++; $b++; }
                  if ($a < $b || ($a != $b && $a < 3)) return false;
              }
              return $i == $n && $j == $m;
          }
        `,
        ruby: code`
          def expressiveWords(s, words)
            words.count { |w| stretchy?(s, w) }
          end

          def stretchy?(s, w)
            i = 0
            j = 0
            while i < s.length && j < w.length
              return false if s[i] != w[j]
              c = s[i]
              a = 0
              b = 0
              while i < s.length && s[i] == c
                i += 1
                a += 1
              end
              while j < w.length && w[j] == c
                j += 1
                b += 1
              end
              return false if a < b || (a != b && a < 3)
            end
            i == s.length && j == w.length
          end
        `,
      },
    };
  })(),

  // ── Subdomain Visit Count (LC 811) ──────────────────────────────
  (() => {
    const ref = (cpdomains: string[]) => {
      const count = new Map<string, number>();
      for (const cp of cpdomains) {
        const [rep, dom] = cp.split(" ");
        const labels = dom.split(".");
        for (let i = 0; i < labels.length; i++) {
          const d = labels.slice(i).join(".");
          count.set(d, (count.get(d) || 0) + Number(rep));
        }
      }
      return [...count.keys()].sort().map((d) => `${count.get(d)} ${d}`);
    };
    const LABELS3 = ["api", "www", "mail", "news", "discuss", "m", "app"];
    const LABELS2 = ["codekairo", "google", "yahoo", "wiki", "leet", "kairo", "go"];
    const TLDS = ["com", "org", "io", "net", "co"];
    return {
      slug: "subdomain-visit-count",
      title: "Subdomain Visit Count",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Counting", "Google", "Amazon", "Walmart"],
      signature: { funcName: "subdomainVisits", params: [{ name: "cpdomains", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "A domain such as `api.codekairo.com` is made of labels separated by dots. Visiting it also counts as a visit to each of its parent domains: `codekairo.com` and `com`.\n\nEach entry of `cpdomains` is a **count-paired domain** `\"rep domain\"`: the domain was visited `rep` times. Return the total number of visits for every domain or parent domain that appears, each as a string `\"total domain\"`.\n\nReturn the strings sorted by **domain**, in ascending lexicographic order (plain character comparison).",
        [
          { in: "cpdomains = [\"900 api.codekairo.com\",\"50 codekairo.com\",\"7 mail.yahoo.com\"]", out: "[\"900 api.codekairo.com\",\"950 codekairo.com\",\"957 com\",\"7 mail.yahoo.com\",\"7 yahoo.com\"]", note: "`com` collects 900 + 50 + 7." },
          { in: "cpdomains = [\"3 a.io\",\"4 b.a.io\"]", out: "[\"7 a.io\",\"4 b.a.io\",\"7 io\"]" },
        ],
        ["1 <= cpdomains.length <= 100", "1 <= cpdomains[i].length <= 100", "cpdomains[i] is \"rep d1.d2.d3\" or \"rep d1.d2\"", "1 <= rep <= 10^4", "d1, d2 and d3 consist of lowercase English letters"]),
      hints: [
        "Every suffix of a domain that starts right after a dot (and the domain itself) receives the visits.",
        "Accumulate the counts in a hash map keyed by domain.",
        "Sort the map's keys at the end and format each line as `count + \" \" + domain`.",
      ],
      editorial: explain({
        idea: "Each count-paired domain contributes its count to itself and to every dot-suffix of it; a hash map sums those contributions.",
        steps: [
          "For each entry, split at the space into `rep` and `domain`.",
          "Add `rep` to `count[domain]`; then repeatedly cut the domain after its first dot and add `rep` to the shorter domain, until there is no dot left.",
          "Sort the domains in the map and emit `\"<count> <domain>\"` for each.",
        ],
        why: "The parent domains of `d1.d2.d3` are exactly its suffixes `d2.d3` and `d3`, each starting right after a dot, so cutting after the first dot repeatedly visits the domain and all its parents once. Summing in the map merges visits that reach the same domain from different entries.",
        time: "O(N · L + D log D) for N entries of length at most L and D distinct domains",
        space: "O(D · L)",
        pitfalls: [
          "Counting the top-level label `com` but forgetting the full domain itself (or vice versa).",
          "Sorting the output strings instead of the domains puts `\"10 b.io\"` before `\"9 a.io\"`.",
          "Parsing `rep` as part of the domain — split at the space first.",
        ],
      }),
      examples: [
        { input: '["900 api.codekairo.com","50 codekairo.com","7 mail.yahoo.com"]', expectedOutput: '["900 api.codekairo.com","950 codekairo.com","957 com","7 mail.yahoo.com","7 yahoo.com"]' },
        { input: '["3 a.io","4 b.a.io"]', expectedOutput: '["7 a.io","4 b.a.io","7 io"]' },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 5), ri(rng, 2, 12)]);
        const tlds = shuffle(rng, TLDS.slice()).slice(0, ri(rng, 1, 3));
        const cps: string[] = [];
        for (let i = 0; i < n; i++) {
          const labels = [pick(rng, LABELS2), pick(rng, tlds)];
          if (rng() < 0.5) labels.unshift(pick(rng, LABELS3));
          const rep = pick(rng, [1, ri(rng, 1, 20), ri(rng, 1, 10000), 10000]);
          cps.push(`${rep} ${labels.join(".")}`);
        }
        return { input: fmtStrArr(cps), expectedOutput: fmtStrArr(ref(cps)) };
      },
      solutions: {
        python: code`
          from typing import List

          def subdomainVisits(cpdomains: List[str]) -> List[str]:
              count = {}
              for cp in cpdomains:
                  rep, dom = cp.split(" ")
                  rep = int(rep)
                  while True:
                      count[dom] = count.get(dom, 0) + rep
                      dot = dom.find(".")
                      if dot < 0:
                          break
                      dom = dom[dot + 1:]
              return [str(count[d]) + " " + d for d in sorted(count)]
        `,
        javascript: code`
          var subdomainVisits = function(cpdomains) {
              var count = new Map();
              for (var i = 0; i < cpdomains.length; i++) {
                  var sp = cpdomains[i].indexOf(" ");
                  var rep = parseInt(cpdomains[i].substring(0, sp), 10);
                  var dom = cpdomains[i].substring(sp + 1);
                  while (true) {
                      count.set(dom, (count.has(dom) ? count.get(dom) : 0) + rep);
                      var dot = dom.indexOf(".");
                      if (dot < 0) break;
                      dom = dom.substring(dot + 1);
                  }
              }
              var keys = Array.from(count.keys()).sort();
              return keys.map(function(d) { return count.get(d) + " " + d; });
          };
        `,
        typescript: code`
          function subdomainVisits(cpdomains: string[]): string[] {
              var count: { [k: string]: number } = {};
              var keys: string[] = [];
              for (var i = 0; i < cpdomains.length; i++) {
                  var sp = cpdomains[i].indexOf(" ");
                  var rep = parseInt(cpdomains[i].substring(0, sp), 10);
                  var dom = cpdomains[i].substring(sp + 1);
                  while (true) {
                      var key = "#" + dom;
                      if (count[key] === undefined) {
                          count[key] = 0;
                          keys.push(dom);
                      }
                      count[key] += rep;
                      var dot = dom.indexOf(".");
                      if (dot < 0) break;
                      dom = dom.substring(dot + 1);
                  }
              }
              keys.sort();
              var res: string[] = [];
              for (var k = 0; k < keys.length; k++) res.push(count["#" + keys[k]] + " " + keys[k]);
              return res;
          }
        `,
        java: code`
          public static String[] subdomainVisits(String[] cpdomains) {
              TreeMap<String, Integer> count = new TreeMap<>();
              for (String cp : cpdomains) {
                  int sp = cp.indexOf(' ');
                  int rep = Integer.parseInt(cp.substring(0, sp));
                  String dom = cp.substring(sp + 1);
                  while (true) {
                      count.merge(dom, rep, Integer::sum);
                      int dot = dom.indexOf('.');
                      if (dot < 0) break;
                      dom = dom.substring(dot + 1);
                  }
              }
              String[] res = new String[count.size()];
              int k = 0;
              for (Map.Entry<String, Integer> e : count.entrySet()) res[k++] = e.getValue() + " " + e.getKey();
              return res;
          }
        `,
        cpp: code`
          vector<string> subdomainVisits(vector<string>& cpdomains) {
              map<string, int> count;
              for (const string& cp : cpdomains) {
                  size_t sp = cp.find(' ');
                  int rep = stoi(cp.substr(0, sp));
                  string dom = cp.substr(sp + 1);
                  while (true) {
                      count[dom] += rep;
                      size_t dot = dom.find('.');
                      if (dot == string::npos) break;
                      dom = dom.substr(dot + 1);
                  }
              }
              vector<string> res;
              for (auto& e : count) res.push_back(to_string(e.second) + " " + e.first);
              return res;
          }
        `,
        c: code`
          static char** sdNames;
          static int sdCmp(const void* a, const void* b) {
              return strcmp(sdNames[*(const int*)a], sdNames[*(const int*)b]);
          }

          char** subdomainVisits(char** cpdomains, int cpdomainsSize, int* returnSize) {
              int cap = cpdomainsSize * 3 + 1, m = 0;
              char** names = (char**)malloc(cap * sizeof(char*));
              int* totals = (int*)malloc(cap * sizeof(int));
              for (int i = 0; i < cpdomainsSize; i++) {
                  const char* cp = cpdomains[i];
                  int rep = 0, p = 0;
                  while (cp[p] != ' ') { rep = rep * 10 + (cp[p] - '0'); p++; }
                  const char* dom = cp + p + 1;
                  while (1) {
                      int found = -1;
                      for (int k = 0; k < m; k++) if (strcmp(names[k], dom) == 0) { found = k; break; }
                      if (found < 0) {
                          names[m] = (char*)dom;
                          totals[m] = 0;
                          found = m++;
                      }
                      totals[found] += rep;
                      const char* dot = strchr(dom, '.');
                      if (dot == NULL) break;
                      dom = dot + 1;
                  }
              }
              int* order = (int*)malloc((m + 1) * sizeof(int));
              for (int k = 0; k < m; k++) order[k] = k;
              sdNames = names;
              qsort(order, m, sizeof(int), sdCmp);
              char** res = (char**)malloc((m + 1) * sizeof(char*));
              for (int k = 0; k < m; k++) {
                  const char* d = names[order[k]];
                  res[k] = (char*)malloc(strlen(d) + 16);
                  sprintf(res[k], "%d %s", totals[order[k]], d);
              }
              free(order);
              free(totals);
              free(names);
              *returnSize = m;
              return res;
          }
        `,
        csharp: code`
          public static string[] SubdomainVisits(string[] cpdomains)
          {
              var count = new Dictionary<string, int>();
              foreach (var cp in cpdomains)
              {
                  int sp = cp.IndexOf(' ');
                  int rep = int.Parse(cp.Substring(0, sp));
                  string dom = cp.Substring(sp + 1);
                  while (true)
                  {
                      int cur;
                      count.TryGetValue(dom, out cur);
                      count[dom] = cur + rep;
                      int dot = dom.IndexOf('.');
                      if (dot < 0) break;
                      dom = dom.Substring(dot + 1);
                  }
              }
              var keys = new List<string>(count.Keys);
              keys.Sort(string.CompareOrdinal);
              var res = new List<string>();
              foreach (var d in keys) res.Add(count[d] + " " + d);
              return res.ToArray();
          }
        `,
        go: code`
          func subdomainVisits(cpdomains []string) []string {
          	count := map[string]int{}
          	for _, cp := range cpdomains {
          		sp := strings.Index(cp, " ")
          		rep, _ := strconv.Atoi(cp[:sp])
          		dom := cp[sp+1:]
          		for {
          			count[dom] += rep
          			dot := strings.Index(dom, ".")
          			if dot < 0 {
          				break
          			}
          			dom = dom[dot+1:]
          		}
          	}
          	keys := make([]string, 0, len(count))
          	for d := range count {
          		keys = append(keys, d)
          	}
          	sort.Strings(keys)
          	res := make([]string, 0, len(keys))
          	for _, d := range keys {
          		res = append(res, fmt.Sprintf("%d %s", count[d], d))
          	}
          	return res
          }
        `,
        kotlin: code`
          fun subdomainVisits(cpdomains: Array<String>): Array<String> {
              val count = java.util.TreeMap<String, Int>()
              for (cp in cpdomains) {
                  val sp = cp.indexOf(' ')
                  val rep = cp.substring(0, sp).toInt()
                  var dom = cp.substring(sp + 1)
                  while (true) {
                      count[dom] = (count[dom] ?: 0) + rep
                      val dot = dom.indexOf('.')
                      if (dot < 0) break
                      dom = dom.substring(dot + 1)
                  }
              }
              return count.entries.map { "" + it.value + " " + it.key }.toTypedArray()
          }
        `,
        swift: code`
          func subdomainVisits(_ cpdomains: [String]) -> [String] {
              var count = [String: Int]()
              for cp in cpdomains {
                  let pieces = cp.split(separator: " ")
                  let rep = Int(String(pieces[0]))!
                  let labels = pieces[1].split(separator: ".").map { String($0) }
                  for i in 0..<labels.count {
                      let d = labels[i...].joined(separator: ".")
                      count[d] = (count[d] ?? 0) + rep
                  }
              }
              return count.keys.sorted().map { "\(count[$0]!) \($0)" }
          }
        `,
        rust: code`
          use std::collections::BTreeMap;

          fn subdomainVisits(cpdomains: Vec<String>) -> Vec<String> {
              let mut count: BTreeMap<String, i32> = BTreeMap::new();
              for cp in cpdomains.iter() {
                  let sp = cp.find(' ').unwrap();
                  let rep: i32 = cp[..sp].parse().unwrap();
                  let mut dom: &str = &cp[sp + 1..];
                  loop {
                      *count.entry(dom.to_string()).or_insert(0) += rep;
                      match dom.find('.') {
                          Some(dot) => dom = &dom[dot + 1..],
                          None => break,
                      }
                  }
              }
              count.iter().map(|(d, c)| format!("{} {}", c, d)).collect()
          }
        `,
        php: code`
          function subdomainVisits($cpdomains) {
              $count = [];
              foreach ($cpdomains as $cp) {
                  $sp = strpos($cp, " ");
                  $rep = intval(substr($cp, 0, $sp));
                  $dom = substr($cp, $sp + 1);
                  while (true) {
                      $count[$dom] = (isset($count[$dom]) ? $count[$dom] : 0) + $rep;
                      $dot = strpos($dom, ".");
                      if ($dot === false) break;
                      $dom = substr($dom, $dot + 1);
                  }
              }
              ksort($count, SORT_STRING);
              $res = [];
              foreach ($count as $d => $c) $res[] = $c . " " . $d;
              return $res;
          }
        `,
        ruby: code`
          def subdomainVisits(cpdomains)
            count = Hash.new(0)
            cpdomains.each do |cp|
              rep, dom = cp.split(" ")
              labels = dom.split(".")
              labels.length.times do |i|
                count[labels[i..-1].join(".")] += rep.to_i
              end
            end
            count.keys.sort.map { |d| "#{count[d]} #{d}" }
          end
        `,
      },
    };
  })(),

  // ── Masking Personal Information (LC 831) ───────────────────────
  (() => {
    const ref = (s: string) => {
      if (s.includes("@")) {
        const [name, domain] = s.toLowerCase().split("@");
        return `${name[0]}*****${name[name.length - 1]}@${domain}`;
      }
      const digits = s.replace(/[^0-9]/g, "");
      const local = `***-***-${digits.slice(-4)}`;
      return digits.length === 10 ? local : `+${"*".repeat(digits.length - 10)}-${local}`;
    };
    const mixCase = (rng: Rng, w: string) => w.split("").map((c) => (rng() < 0.4 ? c.toUpperCase() : c)).join("");
    return {
      slug: "masking-personal-information",
      title: "Masking Personal Information",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Twitter", "Amazon", "Microsoft"],
      signature: { funcName: "maskPII", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "The string `s` is either an **email address** or a **phone number**. Return it masked by the rules below.\n\n**Email address** — `name@domain`, where `name` is at least two English letters and `domain` is English letters with a single `.` somewhere in the middle. To mask it, convert every letter to lowercase and replace all letters of `name` except its first and last with exactly five asterisks `*****`.\n\n**Phone number** — 10 to 13 digits, possibly mixed with the separator characters `+`, `-`, `(`, `)` and space. The last 10 digits are the local number; any digits before them (0 to 3) are the country code. To mask it, drop every separator and write the local number as `***-***-XXXX`, where `XXXX` is its last four digits. With a country code of `k` digits, prefix `+`, then `k` asterisks, then `-`: for example `+**-***-***-XXXX`.",
        [
          { in: "s = \"CodeKairo@Mail.Com\"", out: '"c*****o@mail.com"' },
          { in: "s = \"+91 (987) 654-3210\"", out: '"+**-***-***-3210"', note: "12 digits: a 2-digit country code and the local number." },
          { in: "s = \"(555) 010-9999\"", out: '"***-***-9999"' },
        ],
        ["s is a valid email address or phone number", "For an email: 8 <= s.length <= 40", "For a phone number: 10 <= s.length <= 20"]),
      hints: [
        "Decide which kind of input it is by looking for `@`.",
        "For an email, lowercase the whole string and keep only the first and last letters of the part before `@`.",
        "For a phone number, keep only the digits; the masked form depends only on how many there are and on the last four.",
      ],
      editorial: explain({
        idea: "The two formats are told apart by the `@`; after that each mask is fixed text plus a few kept characters.",
        steps: [
          "If `s` contains `@` at index `at`: lowercase `s` and return `s[0] + \"*****\" + s[at − 1] + s[at…]` (the last letter of the name, then `@` and the domain).",
          "Otherwise collect the digits of `s` in order. Let `local = \"***-***-\" + last four digits`.",
          "If there are exactly 10 digits, return `local`; otherwise return `\"+\" + \"*\" × (digits − 10) + \"-\" + local`.",
        ],
        why: "The email mask always shows five asterisks no matter how long the name is, so only the first and last name letters and the lowercased domain survive. For phones the separators carry no information, and the masked shape depends only on the number of digits (which fixes the country-code length) and the last four digits, which are the only ones shown.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The number of asterisks in an email mask is always five, not the number of hidden letters.",
          "The domain must be lowercased too, not just the name.",
          "A 10-digit phone number gets no `+` prefix and no leading dash.",
        ],
      }),
      examples: [
        { input: '"CodeKairo@Mail.Com"', expectedOutput: "c*****o@mail.com" },
        { input: '"+91 (987) 654-3210"', expectedOutput: "+**-***-***-3210" },
        { input: '"(555) 010-9999"', expectedOutput: "***-***-9999" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.45) {
          let name = mixCase(rng, randLower(rng, 2, 10));
          let d1 = mixCase(rng, randLower(rng, 1, 8));
          let d2 = mixCase(rng, randLower(rng, 1, 5));
          while (name.length + d1.length + d2.length + 2 < 8) d1 += "x";
          while (name.length + d1.length + d2.length + 2 > 40) name = name.slice(0, -1);
          s = `${name}@${d1}.${d2}`;
        } else {
          const nd = ri(rng, 10, 13);
          const digits = Array.from({ length: nd }, () => String(ri(rng, 0, 9)));
          let budget = 20 - nd;
          const parts: string[] = [];
          if (nd > 10 && budget > 0 && rng() < 0.7) { parts.push("+"); budget--; }
          for (let i = 0; i < nd; i++) {
            parts.push(digits[i]);
            if (i < nd - 1 && budget > 0 && rng() < 0.35) {
              const sep = pick(rng, ["-", " ", "(", ")", "-", " "]);
              parts.push(sep);
              budget--;
              if (sep === ")" && budget > 0 && rng() < 0.5) { parts.push(" "); budget--; }
            }
          }
          s = parts.join("");
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def maskPII(s: str) -> str:
              at = s.find("@")
              if at >= 0:
                  low = s.lower()
                  return low[0] + "*****" + low[at - 1:]
              digits = [c for c in s if c.isdigit()]
              local = "***-***-" + "".join(digits[-4:])
              cc = len(digits) - 10
              return local if cc == 0 else "+" + "*" * cc + "-" + local
        `,
        javascript: code`
          var maskPII = function(s) {
              var at = s.indexOf("@");
              if (at >= 0) {
                  var low = s.toLowerCase();
                  return low[0] + "*****" + low.substring(at - 1);
              }
              var digits = "";
              for (var i = 0; i < s.length; i++) {
                  var c = s.charCodeAt(i);
                  if (c >= 48 && c <= 57) digits += s[i];
              }
              var local = "***-***-" + digits.substring(digits.length - 4);
              if (digits.length === 10) return local;
              var stars = "";
              for (var k = 10; k < digits.length; k++) stars += "*";
              return "+" + stars + "-" + local;
          };
        `,
        typescript: code`
          function maskPII(s: string): string {
              var at = s.indexOf("@");
              if (at >= 0) {
                  var low = s.toLowerCase();
                  return low.charAt(0) + "*****" + low.substring(at - 1);
              }
              var digits = "";
              for (var i = 0; i < s.length; i++) {
                  var c = s.charCodeAt(i);
                  if (c >= 48 && c <= 57) digits += s.charAt(i);
              }
              var local = "***-***-" + digits.substring(digits.length - 4);
              if (digits.length === 10) return local;
              var stars = "";
              for (var k = 10; k < digits.length; k++) stars += "*";
              return "+" + stars + "-" + local;
          }
        `,
        java: code`
          public static String maskPII(String s) {
              int at = s.indexOf('@');
              if (at >= 0) {
                  String low = s.toLowerCase();
                  return low.charAt(0) + "*****" + low.substring(at - 1);
              }
              StringBuilder digits = new StringBuilder();
              for (char c : s.toCharArray()) if (c >= '0' && c <= '9') digits.append(c);
              String local = "***-***-" + digits.substring(digits.length() - 4);
              if (digits.length() == 10) return local;
              StringBuilder sb = new StringBuilder("+");
              for (int k = 10; k < digits.length(); k++) sb.append('*');
              return sb.append('-').append(local).toString();
          }
        `,
        cpp: code`
          string maskPII(string s) {
              size_t at = s.find('@');
              if (at != string::npos) {
                  for (char& c : s) if (c >= 'A' && c <= 'Z') c = (char)(c - 'A' + 'a');
                  return string(1, s[0]) + "*****" + s.substr(at - 1);
              }
              string digits;
              for (char c : s) if (c >= '0' && c <= '9') digits.push_back(c);
              string local = "***-***-" + digits.substr(digits.size() - 4);
              if (digits.size() == 10) return local;
              return "+" + string(digits.size() - 10, '*') + "-" + local;
          }
        `,
        c: code`
          static char maskLower(char c) {
              return (c >= 'A' && c <= 'Z') ? (char)(c - 'A' + 'a') : c;
          }

          char* maskPII(const char* s) {
              int n = (int)strlen(s);
              char* out = (char*)malloc(n + 32);
              int at = -1, p = 0;
              for (int i = 0; i < n; i++) if (s[i] == '@') { at = i; break; }
              if (at >= 0) {
                  out[p++] = maskLower(s[0]);
                  for (int k = 0; k < 5; k++) out[p++] = '*';
                  for (int i = at - 1; i < n; i++) out[p++] = maskLower(s[i]);
                  out[p] = '\0';
                  return out;
              }
              char digits[32];
              int d = 0;
              for (int i = 0; i < n; i++) if (s[i] >= '0' && s[i] <= '9') digits[d++] = s[i];
              if (d > 10) {
                  out[p++] = '+';
                  for (int k = 10; k < d; k++) out[p++] = '*';
                  out[p++] = '-';
              }
              memcpy(out + p, "***-***-", 8);
              p += 8;
              for (int i = d - 4; i < d; i++) out[p++] = digits[i];
              out[p] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string MaskPII(string s)
          {
              int at = s.IndexOf('@');
              if (at >= 0)
              {
                  string low = s.ToLowerInvariant();
                  return low[0] + "*****" + low.Substring(at - 1);
              }
              var digits = new System.Text.StringBuilder();
              foreach (char c in s) if (c >= '0' && c <= '9') digits.Append(c);
              string d = digits.ToString();
              string local = "***-***-" + d.Substring(d.Length - 4);
              if (d.Length == 10) return local;
              return "+" + new string('*', d.Length - 10) + "-" + local;
          }
        `,
        go: code`
          func maskPII(s string) string {
          	at := strings.Index(s, "@")
          	if at >= 0 {
          		low := strings.ToLower(s)
          		return low[:1] + "*****" + low[at-1:]
          	}
          	digits := []byte{}
          	for i := 0; i < len(s); i++ {
          		if s[i] >= '0' && s[i] <= '9' {
          			digits = append(digits, s[i])
          		}
          	}
          	local := "***-***-" + string(digits[len(digits)-4:])
          	if len(digits) == 10 {
          		return local
          	}
          	return "+" + strings.Repeat("*", len(digits)-10) + "-" + local
          }
        `,
        kotlin: code`
          fun maskPII(s: String): String {
              val at = s.indexOf('@')
              if (at >= 0) {
                  val low = s.toLowerCase()
                  return "" + low[0] + "*****" + low.substring(at - 1)
              }
              val digits = s.filter { it in '0'..'9' }
              val local = "***-***-" + digits.substring(digits.length - 4)
              if (digits.length == 10) return local
              return "+" + "*".repeat(digits.length - 10) + "-" + local
          }
        `,
        swift: code`
          func maskPII(_ s: String) -> String {
              let chars = Array(s.lowercased())
              if let at = chars.firstIndex(of: "@") {
                  return String(chars[0]) + "*****" + String(chars[(at - 1)...])
              }
              let digits = Array(s).filter { $0 >= "0" && $0 <= "9" }
              let local = "***-***-" + String(digits[(digits.count - 4)...])
              if digits.count == 10 { return local }
              return "+" + String(repeating: "*", count: digits.count - 10) + "-" + local
          }
        `,
        rust: code`
          fn maskPII(s: String) -> String {
              if let Some(at) = s.find('@') {
                  let low = s.to_lowercase();
                  return format!("{}*****{}", &low[..1], &low[at - 1..]);
              }
              let digits: Vec<char> = s.chars().filter(|c| c.is_ascii_digit()).collect();
              let n = digits.len();
              let last: String = digits[n - 4..].iter().collect();
              let local = format!("***-***-{}", last);
              if n == 10 {
                  return local;
              }
              format!("+{}-{}", "*".repeat(n - 10), local)
          }
        `,
        php: code`
          function maskPII($s) {
              $at = strpos($s, "@");
              if ($at !== false) {
                  $low = strtolower($s);
                  return $low[0] . "*****" . substr($low, $at - 1);
              }
              $digits = preg_replace("/[^0-9]/", "", $s);
              $n = strlen($digits);
              $local = "***-***-" . substr($digits, $n - 4);
              if ($n == 10) return $local;
              return "+" . str_repeat("*", $n - 10) . "-" . $local;
          }
        `,
        ruby: code`
          def maskPII(s)
            at = s.index("@")
            if at
              low = s.downcase
              return low[0] + "*****" + low[(at - 1)..-1]
            end
            digits = s.gsub(/[^0-9]/, "")
            local = "***-***-" + digits[-4..-1]
            return local if digits.length == 10
            "+" + "*" * (digits.length - 10) + "-" + local
          end
        `,
      },
    };
  })(),

  // ── Find And Replace in String (LC 833) ─────────────────────────
  (() => {
    const ref = (s: string, indices: number[], sources: string[], targets: string[]) => {
      const rep = new Map<number, number>();
      for (let i = 0; i < indices.length; i++) if (s.startsWith(sources[i], indices[i])) rep.set(indices[i], i);
      let out = "";
      for (let p = 0; p < s.length;) {
        const j = rep.get(p);
        if (j !== undefined) { out += targets[j]; p += sources[j].length; } else { out += s[p]; p++; }
      }
      return out;
    };
    return {
      slug: "find-and-replace-in-string",
      title: "Find And Replace in String",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Sorting", "Google", "Amazon", "Microsoft"],
      signature: {
        funcName: "findReplaceString",
        params: [{ name: "s", type: "string" as const }, { name: "indices", type: "int[]" as const }, { name: "sources", type: "string[]" as const }, { name: "targets", type: "string[]" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a string `s` and `k` replacement operations described by three parallel arrays `indices`, `sources` and `targets`.\n\nOperation `i` checks whether `sources[i]` occurs in the **original** `s` starting exactly at index `indices[i]`. If it does, that occurrence is replaced by `targets[i]`; if it does not, the operation does nothing.\n\nAll operations are applied **simultaneously** — every check looks at the original string, and replacing text never shifts the indices other operations refer to. The inputs guarantee that no two operations that do match overlap. The operations are not given in any particular order. Return the resulting string.",
        [
          { in: "s = \"codekairo\", indices = [0,4], sources = [\"code\",\"kai\"], targets = [\"bug\",\"hunt\"]", out: "bughuntro" },
          { in: "s = \"pairroom\", indices = [4,0], sources = [\"room\",\"pear\"], targets = [\"mode\",\"duel\"]", out: "pairmode", note: "`pear` does not occur at index 0, so only the first operation applies." },
          { in: "s = \"aaa\", indices = [2,0], sources = [\"a\",\"aa\"], targets = [\"z\",\"b\"]", out: "bz" },
        ],
        ["1 <= s.length <= 1000", "k == indices.length == sources.length == targets.length", "1 <= k <= 100", "0 <= indices[i] < s.length", "1 <= sources[i].length, targets[i].length <= 50", "s, sources[i] and targets[i] consist of lowercase English letters", "The values of indices are distinct, and matching operations never overlap"]),
      hints: [
        "Decide first which operations match, using the original string only.",
        "Record, for each starting index, which operation (if any) matched there.",
        "Then build the answer left to right: at a recorded index emit the target and jump past the source; otherwise copy one character.",
      ],
      editorial: explain({
        idea: "Because every check reads the original string and matching ranges never overlap, the matches can be found first and the output built in a single left-to-right pass.",
        steps: [
          "Create `match`, an array of length `n` filled with −1.",
          "For each operation `i`, if `s` has `sources[i]` at position `indices[i]`, set `match[indices[i]] = i`.",
          "Scan `p` from 0: if `match[p] = j ≥ 0`, append `targets[j]` and advance `p` by `sources[j].length`; otherwise append `s[p]` and advance by one.",
        ],
        why: "Recording matches against the untouched string implements the simultaneous semantics, and a position-indexed table removes any dependence on the order the operations were given in. Since matched ranges do not overlap, jumping over a replaced range never skips the start of another match.",
        time: "O(n + Σ|sources[i]| + Σ|targets[i]|)",
        space: "O(n)",
        pitfalls: [
          "Applying operations one by one on the changing string shifts later indices.",
          "The operations are unsorted; processing them in input order without a table breaks.",
          "A source may run past the end of `s` — that is simply a non-match, not an error.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n[0,4]\n["code","kai"]\n["bug","hunt"]', expectedOutput: "bughuntro" },
        { input: '"pairroom"\n[4,0]\n["room","pear"]\n["mode","duel"]', expectedOutput: "pairmode" },
        { input: '"aaa"\n[2,0]\n["a","aa"]\n["z","b"]', expectedOutput: "bz" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 8), ri(rng, 9, 25)]);
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, n, n, alpha);
        const all: number[] = [];
        for (let i = 0; i < n; i++) all.push(i);
        const idxs = shuffle(rng, all).slice(0, ri(rng, 1, Math.min(n, 7)));
        const covered: boolean[] = new Array(n).fill(false);
        const indices: number[] = [], sources: string[] = [], targets: string[] = [];
        for (const idx of idxs) {
          const src = rng() < 0.65 ? s.slice(idx, idx + ri(rng, 1, 3)) : randLower(rng, 1, 3, alpha);
          if (s.startsWith(src, idx)) {
            let clash = false;
            for (let p = idx; p < idx + src.length; p++) if (covered[p]) clash = true;
            if (clash) continue;
            for (let p = idx; p < idx + src.length; p++) covered[p] = true;
          }
          indices.push(idx);
          sources.push(src);
          targets.push(randLower(rng, 1, 4));
        }
        return {
          input: `"${s}"\n${fmtIntArr(indices)}\n${fmtStrArr(sources)}\n${fmtStrArr(targets)}`,
          expectedOutput: ref(s, indices, sources, targets),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def findReplaceString(s: str, indices: List[int], sources: List[str], targets: List[str]) -> str:
              match = {}
              for i, idx in enumerate(indices):
                  if s.startswith(sources[i], idx):
                      match[idx] = i
              out = []
              p = 0
              while p < len(s):
                  if p in match:
                      j = match[p]
                      out.append(targets[j])
                      p += len(sources[j])
                  else:
                      out.append(s[p])
                      p += 1
              return "".join(out)
        `,
        javascript: code`
          var findReplaceString = function(s, indices, sources, targets) {
              var n = s.length;
              var match = [];
              for (var i = 0; i < n; i++) match.push(-1);
              for (var k = 0; k < indices.length; k++) {
                  var idx = indices[k];
                  if (s.substring(idx, idx + sources[k].length) === sources[k]) match[idx] = k;
              }
              var out = [];
              for (var p = 0; p < n; ) {
                  var j = match[p];
                  if (j >= 0) {
                      out.push(targets[j]);
                      p += sources[j].length;
                  } else {
                      out.push(s[p]);
                      p++;
                  }
              }
              return out.join("");
          };
        `,
        typescript: code`
          function findReplaceString(s: string, indices: number[], sources: string[], targets: string[]): string {
              var n = s.length;
              var match: number[] = [];
              for (var i = 0; i < n; i++) match.push(-1);
              for (var k = 0; k < indices.length; k++) {
                  var idx = indices[k];
                  if (s.substring(idx, idx + sources[k].length) === sources[k]) match[idx] = k;
              }
              var out: string[] = [];
              for (var p = 0; p < n; ) {
                  var j = match[p];
                  if (j >= 0) {
                      out.push(targets[j]);
                      p += sources[j].length;
                  } else {
                      out.push(s.charAt(p));
                      p++;
                  }
              }
              return out.join("");
          }
        `,
        java: code`
          public static String findReplaceString(String s, int[] indices, String[] sources, String[] targets) {
              int n = s.length();
              int[] match = new int[n];
              Arrays.fill(match, -1);
              for (int k = 0; k < indices.length; k++) {
                  if (s.startsWith(sources[k], indices[k])) match[indices[k]] = k;
              }
              StringBuilder sb = new StringBuilder();
              for (int p = 0; p < n; ) {
                  int j = match[p];
                  if (j >= 0) {
                      sb.append(targets[j]);
                      p += sources[j].length();
                  } else {
                      sb.append(s.charAt(p));
                      p++;
                  }
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string findReplaceString(string s, vector<int>& indices, vector<string>& sources, vector<string>& targets) {
              int n = (int)s.size();
              vector<int> match(n, -1);
              for (size_t k = 0; k < indices.size(); k++) {
                  if (s.compare(indices[k], sources[k].size(), sources[k]) == 0) match[indices[k]] = (int)k;
              }
              string out;
              for (int p = 0; p < n; ) {
                  int j = match[p];
                  if (j >= 0) {
                      out += targets[j];
                      p += (int)sources[j].size();
                  } else {
                      out.push_back(s[p]);
                      p++;
                  }
              }
              return out;
          }
        `,
        c: code`
          char* findReplaceString(const char* s, int* indices, int indicesSize, char** sources, int sourcesSize, char** targets, int targetsSize) {
              int n = (int)strlen(s);
              int* match = (int*)malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) match[i] = -1;
              int extra = 0;
              for (int k = 0; k < indicesSize; k++) {
                  int idx = indices[k];
                  int len = (int)strlen(sources[k]);
                  if (idx + len <= n && strncmp(s + idx, sources[k], len) == 0) match[idx] = k;
                  extra += (int)strlen(targets[k]);
              }
              char* out = (char*)malloc(n + extra + 1);
              int q = 0;
              for (int p = 0; p < n; ) {
                  int j = match[p];
                  if (j >= 0) {
                      int tl = (int)strlen(targets[j]);
                      memcpy(out + q, targets[j], tl);
                      q += tl;
                      p += (int)strlen(sources[j]);
                  } else {
                      out[q++] = s[p++];
                  }
              }
              out[q] = '\0';
              free(match);
              return out;
          }
        `,
        csharp: code`
          public static string FindReplaceString(string s, int[] indices, string[] sources, string[] targets)
          {
              int n = s.Length;
              var match = new int[n];
              for (int i = 0; i < n; i++) match[i] = -1;
              for (int k = 0; k < indices.Length; k++)
              {
                  int idx = indices[k];
                  if (idx + sources[k].Length <= n && string.CompareOrdinal(s, idx, sources[k], 0, sources[k].Length) == 0) match[idx] = k;
              }
              var sb = new System.Text.StringBuilder();
              for (int p = 0; p < n; )
              {
                  int j = match[p];
                  if (j >= 0)
                  {
                      sb.Append(targets[j]);
                      p += sources[j].Length;
                  }
                  else
                  {
                      sb.Append(s[p]);
                      p++;
                  }
              }
              return sb.ToString();
          }
        `,
        go: code`
          func findReplaceString(s string, indices []int, sources []string, targets []string) string {
          	n := len(s)
          	match := make([]int, n)
          	for i := range match {
          		match[i] = -1
          	}
          	for k, idx := range indices {
          		if strings.HasPrefix(s[idx:], sources[k]) {
          			match[idx] = k
          		}
          	}
          	var sb strings.Builder
          	for p := 0; p < n; {
          		j := match[p]
          		if j >= 0 {
          			sb.WriteString(targets[j])
          			p += len(sources[j])
          		} else {
          			sb.WriteByte(s[p])
          			p++
          		}
          	}
          	return sb.String()
          }
        `,
        kotlin: code`
          fun findReplaceString(s: String, indices: IntArray, sources: Array<String>, targets: Array<String>): String {
              val n = s.length
              val match = IntArray(n) { -1 }
              for (k in indices.indices) {
                  if (s.startsWith(sources[k], indices[k])) match[indices[k]] = k
              }
              val sb = StringBuilder()
              var p = 0
              while (p < n) {
                  val j = match[p]
                  if (j >= 0) {
                      sb.append(targets[j])
                      p += sources[j].length
                  } else {
                      sb.append(s[p])
                      p++
                  }
              }
              return sb.toString()
          }
        `,
        swift: code`
          func findReplaceString(_ s: String, _ indices: [Int], _ sources: [String], _ targets: [String]) -> String {
              let a = Array(s)
              let n = a.count
              var match = [Int](repeating: -1, count: n)
              for k in 0..<indices.count {
                  let idx = indices[k]
                  let src = Array(sources[k])
                  if idx + src.count <= n && Array(a[idx..<(idx + src.count)]) == src { match[idx] = k }
              }
              var out = ""
              var p = 0
              while p < n {
                  let j = match[p]
                  if j >= 0 {
                      out += targets[j]
                      p += sources[j].count
                  } else {
                      out.append(a[p])
                      p += 1
                  }
              }
              return out
          }
        `,
        rust: code`
          fn findReplaceString(s: String, indices: Vec<i32>, sources: Vec<String>, targets: Vec<String>) -> String {
              let b = s.as_bytes();
              let n = b.len();
              let mut matched: Vec<i32> = vec![-1; n];
              for k in 0..indices.len() {
                  let idx = indices[k] as usize;
                  let src = sources[k].as_bytes();
                  if idx + src.len() <= n && &b[idx..idx + src.len()] == src {
                      matched[idx] = k as i32;
                  }
              }
              let mut out = String::new();
              let mut p = 0;
              while p < n {
                  let j = matched[p];
                  if j >= 0 {
                      out.push_str(&targets[j as usize]);
                      p += sources[j as usize].len();
                  } else {
                      out.push(b[p] as char);
                      p += 1;
                  }
              }
              out
          }
        `,
        php: code`
          function findReplaceString($s, $indices, $sources, $targets) {
              $n = strlen($s);
              $match = array_fill(0, $n, -1);
              foreach ($indices as $k => $idx) {
                  if (substr($s, $idx, strlen($sources[$k])) === $sources[$k]) $match[$idx] = $k;
              }
              $out = "";
              for ($p = 0; $p < $n; ) {
                  $j = $match[$p];
                  if ($j >= 0) {
                      $out .= $targets[$j];
                      $p += strlen($sources[$j]);
                  } else {
                      $out .= $s[$p];
                      $p++;
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def findReplaceString(s, indices, sources, targets)
            match = {}
            indices.each_with_index do |idx, k|
              match[idx] = k if s[idx, sources[k].length] == sources[k]
            end
            out = +""
            p = 0
            while p < s.length
              j = match[p]
              if j
                out << targets[j]
                p += sources[j].length
              else
                out << s[p]
                p += 1
              end
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Reorder Data in Log Files (LC 937) ──────────────────────────
  (() => {
    const ref = (logs: string[]) => {
      const isDigitLog = (l: string) => /^[0-9]$/.test(l[l.indexOf(" ") + 1]);
      const letters = logs.filter((l) => !isDigitLog(l));
      const digits = logs.filter(isDigitLog);
      const key = (l: string) => [l.slice(l.indexOf(" ") + 1), l.slice(0, l.indexOf(" "))];
      letters.sort((a, b) => {
        const [ba, ia] = key(a), [bb, ib] = key(b);
        if (ba !== bb) return ba < bb ? -1 : 1;
        return ia < ib ? -1 : ia > ib ? 1 : 0;
      });
      return letters.concat(digits);
    };
    return {
      slug: "reorder-data-in-log-files",
      title: "Reorder Data in Log Files",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Sorting", "Amazon", "Microsoft"],
      signature: { funcName: "reorderLogFiles", params: [{ name: "logs", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "Each log is a string of space-separated words; the first word is the log's **identifier** (lowercase letters and digits). There are two kinds of logs:\n\n- **letter-logs** — every word after the identifier consists of lowercase letters;\n- **digit-logs** — every word after the identifier consists of digits.\n\nReorder the logs so that:\n\n1. all letter-logs come before all digit-logs;\n2. letter-logs are sorted by their contents (everything after the identifier); logs with equal contents are sorted by identifier — both by plain character comparison;\n3. digit-logs keep their original relative order.\n\nReturn the reordered list.",
        [
          { in: "logs = [\"k1 duel won\",\"x9 7 3 1\",\"a2 pair mode\",\"b4 0 2\",\"c3 duel won\"]", out: "[\"c3 duel won\",\"k1 duel won\",\"a2 pair mode\",\"x9 7 3 1\",\"b4 0 2\"]", note: "The two `duel won` logs tie on contents and are ordered by identifier." },
          { in: "logs = [\"g1 act car\",\"g2 act\",\"z0 9 9\"]", out: "[\"g2 act\",\"g1 act car\",\"z0 9 9\"]", note: "`act` is a prefix of `act car`, so it sorts first." },
        ],
        ["1 <= logs.length <= 100", "3 <= logs[i].length <= 100", "Words in a log are separated by single spaces", "Every log has an identifier and at least one word after it"]),
      hints: [
        "The kind of a log is decided by the first character after the first space.",
        "Split the logs into two lists, keeping the digit-logs in input order.",
        "Sort the letter-logs with a comparator on (contents, identifier), then append the digit-logs.",
      ],
      editorial: explain({
        idea: "Partition the logs by kind, sort only the letter-logs with the two-level key, and append the untouched digit-logs.",
        steps: [
          "For each log find its first space; the character after it tells whether it is a digit-log.",
          "Collect digit-logs in input order and letter-logs separately.",
          "Sort the letter-logs by contents (text after the first space) and break ties by identifier (text before it).",
          "Return the sorted letter-logs followed by the digit-logs.",
        ],
        why: "The required order is exactly the concatenation of the two groups, the letter group being a total order on (contents, identifier) and the digit group being the input order; keeping digit-logs out of the sort avoids depending on sort stability.",
        time: "O(n log n · L) for n logs of length up to L",
        space: "O(n · L)",
        pitfalls: [
          "Comparing whole log strings sorts by identifier first — the contents must come first.",
          "Digit-logs must keep their original order; an unstable sort over everything can scramble them.",
          "An identifier may contain digits (`x9`); only the first content word decides the kind.",
        ],
      }),
      examples: [
        { input: '["k1 duel won","x9 7 3 1","a2 pair mode","b4 0 2","c3 duel won"]', expectedOutput: '["c3 duel won","k1 duel won","a2 pair mode","x9 7 3 1","b4 0 2"]' },
        { input: '["g1 act car","g2 act","z0 9 9"]', expectedOutput: '["g2 act","g1 act car","z0 9 9"]' },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 4), ri(rng, 2, 10)]);
        const letterAlpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const logs: string[] = [];
        for (let i = 0; i < n; i++) {
          const id = randLower(rng, 1, 3, pick(rng, ["abc12", "xy9", "abcdefghijklmnopqrstuvwxyz0123456789"]));
          const words = ri(rng, 1, 3);
          const parts = [id];
          const digit = rng() < 0.4;
          for (let w = 0; w < words; w++) parts.push(digit ? randLower(rng, 1, 3, "0123456789") : randLower(rng, 1, 3, letterAlpha));
          let log = parts.join(" ");
          if (log.length < 3) log += digit ? "0" : "a";
          logs.push(log);
        }
        return { input: fmtStrArr(logs), expectedOutput: fmtStrArr(ref(logs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def reorderLogFiles(logs: List[str]) -> List[str]:
              letters = []
              digits = []
              for log in logs:
                  ident, body = log.split(" ", 1)
                  if body[0].isdigit():
                      digits.append(log)
                  else:
                      letters.append((body, ident, log))
              letters.sort()
              return [t[2] for t in letters] + digits
        `,
        javascript: code`
          var reorderLogFiles = function(logs) {
              var letters = [], digits = [];
              for (var i = 0; i < logs.length; i++) {
                  var sp = logs[i].indexOf(" ");
                  var c = logs[i].charCodeAt(sp + 1);
                  if (c >= 48 && c <= 57) digits.push(logs[i]);
                  else letters.push({ id: logs[i].substring(0, sp), body: logs[i].substring(sp + 1), log: logs[i] });
              }
              letters.sort(function(a, b) {
                  if (a.body !== b.body) return a.body < b.body ? -1 : 1;
                  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
                  return 0;
              });
              var res = [];
              for (var k = 0; k < letters.length; k++) res.push(letters[k].log);
              return res.concat(digits);
          };
        `,
        typescript: code`
          function reorderLogFiles(logs: string[]): string[] {
              var letters: { id: string; body: string; log: string }[] = [];
              var digits: string[] = [];
              for (var i = 0; i < logs.length; i++) {
                  var sp = logs[i].indexOf(" ");
                  var c = logs[i].charCodeAt(sp + 1);
                  if (c >= 48 && c <= 57) digits.push(logs[i]);
                  else letters.push({ id: logs[i].substring(0, sp), body: logs[i].substring(sp + 1), log: logs[i] });
              }
              letters.sort(function(a, b) {
                  if (a.body !== b.body) return a.body < b.body ? -1 : 1;
                  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
                  return 0;
              });
              var res: string[] = [];
              for (var k = 0; k < letters.length; k++) res.push(letters[k].log);
              return res.concat(digits);
          }
        `,
        java: code`
          public static String[] reorderLogFiles(String[] logs) {
              List<String> letters = new ArrayList<>();
              List<String> digits = new ArrayList<>();
              for (String log : logs) {
                  char c = log.charAt(log.indexOf(' ') + 1);
                  if (c >= '0' && c <= '9') digits.add(log);
                  else letters.add(log);
              }
              letters.sort((a, b) -> {
                  int sa = a.indexOf(' '), sb = b.indexOf(' ');
                  int cmp = a.substring(sa + 1).compareTo(b.substring(sb + 1));
                  if (cmp != 0) return cmp;
                  return a.substring(0, sa).compareTo(b.substring(0, sb));
              });
              letters.addAll(digits);
              return letters.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> reorderLogFiles(vector<string>& logs) {
              vector<string> letters, digits;
              for (const string& log : logs) {
                  char c = log[log.find(' ') + 1];
                  if (c >= '0' && c <= '9') digits.push_back(log);
                  else letters.push_back(log);
              }
              sort(letters.begin(), letters.end(), [](const string& a, const string& b) {
                  size_t sa = a.find(' '), sb = b.find(' ');
                  string ba = a.substr(sa + 1), bb = b.substr(sb + 1);
                  if (ba != bb) return ba < bb;
                  return a.substr(0, sa) < b.substr(0, sb);
              });
              letters.insert(letters.end(), digits.begin(), digits.end());
              return letters;
          }
        `,
        c: code`
          static int logCmp(const void* x, const void* y) {
              const char* a = *(const char* const*)x;
              const char* b = *(const char* const*)y;
              const char* ba = strchr(a, ' ') + 1;
              const char* bb = strchr(b, ' ') + 1;
              int c = strcmp(ba, bb);
              if (c != 0) return c;
              int la = (int)(ba - a - 1), lb = (int)(bb - b - 1);
              c = strncmp(a, b, la < lb ? la : lb);
              if (c != 0) return c;
              return (la > lb) - (la < lb);
          }

          char** reorderLogFiles(char** logs, int logsSize, int* returnSize) {
              char** res = (char**)malloc((logsSize + 1) * sizeof(char*));
              int p = 0;
              for (int i = 0; i < logsSize; i++) {
                  char c = strchr(logs[i], ' ')[1];
                  if (!(c >= '0' && c <= '9')) res[p++] = logs[i];
              }
              qsort(res, p, sizeof(char*), logCmp);
              for (int i = 0; i < logsSize; i++) {
                  char c = strchr(logs[i], ' ')[1];
                  if (c >= '0' && c <= '9') res[p++] = logs[i];
              }
              *returnSize = logsSize;
              return res;
          }
        `,
        csharp: code`
          public static string[] ReorderLogFiles(string[] logs)
          {
              var letters = new List<string>();
              var digits = new List<string>();
              foreach (var log in logs)
              {
                  char c = log[log.IndexOf(' ') + 1];
                  if (c >= '0' && c <= '9') digits.Add(log);
                  else letters.Add(log);
              }
              letters.Sort((a, b) =>
              {
                  int sa = a.IndexOf(' '), sb = b.IndexOf(' ');
                  int cmp = string.CompareOrdinal(a.Substring(sa + 1), b.Substring(sb + 1));
                  if (cmp != 0) return cmp;
                  return string.CompareOrdinal(a.Substring(0, sa), b.Substring(0, sb));
              });
              letters.AddRange(digits);
              return letters.ToArray();
          }
        `,
        go: code`
          func reorderLogFiles(logs []string) []string {
          	letters := []string{}
          	digits := []string{}
          	for _, lg := range logs {
          		c := lg[strings.Index(lg, " ")+1]
          		if c >= '0' && c <= '9' {
          			digits = append(digits, lg)
          		} else {
          			letters = append(letters, lg)
          		}
          	}
          	sort.SliceStable(letters, func(i, j int) bool {
          		a, b := letters[i], letters[j]
          		sa, sb := strings.Index(a, " "), strings.Index(b, " ")
          		if a[sa+1:] != b[sb+1:] {
          			return a[sa+1:] < b[sb+1:]
          		}
          		return a[:sa] < b[:sb]
          	})
          	return append(letters, digits...)
          }
        `,
        kotlin: code`
          fun reorderLogFiles(logs: Array<String>): Array<String> {
              val letters = ArrayList<String>()
              val digits = ArrayList<String>()
              for (log in logs) {
                  val c = log[log.indexOf(' ') + 1]
                  if (c in '0'..'9') digits.add(log) else letters.add(log)
              }
              val sorted = letters.sortedWith(Comparator<String> { a, b ->
                  val sa = a.indexOf(' ')
                  val sb = b.indexOf(' ')
                  val cmp = a.substring(sa + 1).compareTo(b.substring(sb + 1))
                  if (cmp != 0) cmp else a.substring(0, sa).compareTo(b.substring(0, sb))
              })
              return (sorted + digits).toTypedArray()
          }
        `,
        swift: code`
          func reorderLogFiles(_ logs: [String]) -> [String] {
              var letters = [(String, String, String)]()
              var digits = [String]()
              for log in logs {
                  let parts = log.split(separator: " ", maxSplits: 1)
                  let ident = String(parts[0])
                  let body = String(parts[1])
                  let f = body.first!
                  if f >= "0" && f <= "9" {
                      digits.append(log)
                  } else {
                      letters.append((body, ident, log))
                  }
              }
              letters.sort { a, b in a.0 != b.0 ? a.0 < b.0 : a.1 < b.1 }
              return letters.map { $0.2 } + digits
          }
        `,
        rust: code`
          fn reorderLogFiles(logs: Vec<String>) -> Vec<String> {
              let mut letters: Vec<(String, String, String)> = Vec::new();
              let mut digits: Vec<String> = Vec::new();
              for log in logs.into_iter() {
                  let sp = log.find(' ').unwrap();
                  let body = log[sp + 1..].to_string();
                  let ident = log[..sp].to_string();
                  if body.as_bytes()[0].is_ascii_digit() {
                      digits.push(log);
                  } else {
                      letters.push((body, ident, log));
                  }
              }
              letters.sort();
              let mut res: Vec<String> = letters.into_iter().map(|t| t.2).collect();
              res.extend(digits);
              res
          }
        `,
        php: code`
          function reorderLogFiles($logs) {
              $letters = [];
              $digits = [];
              foreach ($logs as $log) {
                  $sp = strpos($log, " ");
                  $c = ord($log[$sp + 1]);
                  if ($c >= 48 && $c <= 57) $digits[] = $log;
                  else $letters[] = [substr($log, $sp + 1), substr($log, 0, $sp), $log];
              }
              usort($letters, function ($a, $b) {
                  $c = strcmp($a[0], $b[0]);
                  return $c != 0 ? $c : strcmp($a[1], $b[1]);
              });
              $res = [];
              foreach ($letters as $t) $res[] = $t[2];
              foreach ($digits as $d) $res[] = $d;
              return $res;
          }
        `,
        ruby: code`
          def reorderLogFiles(logs)
            letters = []
            digits = []
            logs.each do |log|
              ident, body = log.split(" ", 2)
              if body[0] >= "0" && body[0] <= "9"
                digits << log
              else
                letters << [body, ident, log]
              end
            end
            letters.sort.map { |t| t[2] } + digits
          end
        `,
      },
    };
  })(),

  // ── Letter Tile Possibilities (LC 1079) ─────────────────────────
  (() => {
    const FACT = [1, 1, 2, 6, 24, 120, 720, 5040];
    // Independent check: Σ over every sub-multiset of the tiles of its number of arrangements.
    const ref = (tiles: string) => {
      const m = new Map<string, number>();
      for (const c of tiles) m.set(c, (m.get(c) || 0) + 1);
      const counts = [...m.values()];
      let total = 0;
      const rec = (i: number, chosen: number[]) => {
        if (i === counts.length) {
          const sz = chosen.reduce((a, b) => a + b, 0);
          if (sz > 0) {
            let v = FACT[sz];
            for (const c of chosen) v /= FACT[c];
            total += v;
          }
          return;
        }
        for (let c = 0; c <= counts[i]; c++) { chosen.push(c); rec(i + 1, chosen); chosen.pop(); }
      };
      rec(0, []);
      return total;
    };
    return {
      slug: "letter-tile-possibilities",
      title: "Letter Tile Possibilities",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Backtracking", "Counting", "Amazon", "Google"],
      signature: { funcName: "numTilePossibilities", params: [{ name: "tiles", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You have a set of letter tiles; `tiles[i]` is the letter printed on the `i`-th tile, and several tiles may carry the same letter.\n\nReturn the number of distinct **non-empty** sequences of letters you can spell by laying some of the tiles in a row (each tile at most once). Two sequences are the same when they read the same, regardless of which tiles were used.",
        [
          { in: "tiles = \"KOK\"", out: "8", note: "`K`, `O`, `KK`, `KO`, `OK`, `KKO`, `KOK`, `OKK`." },
          { in: "tiles = \"ABC\"", out: "15", note: "3 of length one, 6 of length two, 6 of length three." },
          { in: "tiles = \"Z\"", out: "1" },
        ],
        ["1 <= tiles.length <= 7", "tiles consists of uppercase English letters"]),
      hints: [
        "Generating sequences position by position counts duplicates when two tiles share a letter — choose letters, not tiles.",
        "Keep a count per letter. At each step, any letter with a remaining count can be appended.",
        "Every append creates one new distinct sequence; recurse after decrementing that letter's count and restore it afterwards.",
      ],
      editorial: explain({
        idea: "Count distinct sequences by building them letter by letter over the letter counts: each distinct letter choice at each position leads to a distinct sequence, so a DFS over counts enumerates each sequence exactly once.",
        steps: [
          "Count how many tiles carry each letter.",
          "Define `dfs()`: for every letter with a positive count, decrement it, add `1 + dfs()` to the total (the sequence ending here plus all its extensions), and restore the count.",
          "Return `dfs()` from the full counts.",
        ],
        why: "A sequence is determined by its letters in order, and the DFS branches on the next letter (not the next tile), so two branches always differ in some position and never produce the same sequence; every sequence that the counts allow is reached by following its letters. Equivalently, the answer is the sum over every non-empty sub-multiset of its number of arrangements `k! / Π c_i!` — a handy cross-check.",
        time: "O(answer · 26) — at most 13 699 sequences for seven distinct tiles",
        space: "O(n) recursion depth",
        pitfalls: [
          "Permuting tiles instead of letters counts `KOK` and `KOK` (with the two K tiles swapped) twice.",
          "The empty sequence does not count.",
          "Forgetting to restore the count after the recursive call.",
        ],
      }),
      examples: [
        { input: '"KOK"', expectedOutput: "8" },
        { input: '"ABC"', expectedOutput: "15" },
        { input: '"Z"', expectedOutput: "1" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 7);
        const alpha = pick(rng, ["A", "AB", "ABC", "ABCD", "ABCDEFG", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"]);
        const tiles = randLower(rng, len, len, alpha);
        return { input: `"${tiles}"`, expectedOutput: String(ref(tiles)) };
      },
      solutions: {
        python: code`
          def numTilePossibilities(tiles: str) -> int:
              count = [0] * 26
              for ch in tiles:
                  count[ord(ch) - 65] += 1

              def dfs():
                  total = 0
                  for c in range(26):
                      if count[c] == 0:
                          continue
                      count[c] -= 1
                      total += 1 + dfs()
                      count[c] += 1
                  return total

              return dfs()
        `,
        javascript: code`
          var numTilePossibilities = function(tiles) {
              var count = [];
              for (var i = 0; i < 26; i++) count.push(0);
              for (var j = 0; j < tiles.length; j++) count[tiles.charCodeAt(j) - 65]++;
              var dfs = function() {
                  var total = 0;
                  for (var c = 0; c < 26; c++) {
                      if (count[c] === 0) continue;
                      count[c]--;
                      total += 1 + dfs();
                      count[c]++;
                  }
                  return total;
              };
              return dfs();
          };
        `,
        typescript: code`
          function numTilePossibilities(tiles: string): number {
              var count: number[] = [];
              for (var i = 0; i < 26; i++) count.push(0);
              for (var j = 0; j < tiles.length; j++) count[tiles.charCodeAt(j) - 65]++;
              var dfs = function(): number {
                  var total = 0;
                  for (var c = 0; c < 26; c++) {
                      if (count[c] === 0) continue;
                      count[c]--;
                      total += 1 + dfs();
                      count[c]++;
                  }
                  return total;
              };
              return dfs();
          }
        `,
        java: code`
          public static int numTilePossibilities(String tiles) {
              int[] count = new int[26];
              for (char ch : tiles.toCharArray()) count[ch - 'A']++;
              return tileDfs(count);
          }

          static int tileDfs(int[] count) {
              int total = 0;
              for (int c = 0; c < 26; c++) {
                  if (count[c] == 0) continue;
                  count[c]--;
                  total += 1 + tileDfs(count);
                  count[c]++;
              }
              return total;
          }
        `,
        cpp: code`
          int tileDfs(vector<int>& count) {
              int total = 0;
              for (int c = 0; c < 26; c++) {
                  if (count[c] == 0) continue;
                  count[c]--;
                  total += 1 + tileDfs(count);
                  count[c]++;
              }
              return total;
          }

          int numTilePossibilities(string tiles) {
              vector<int> count(26, 0);
              for (char ch : tiles) count[ch - 'A']++;
              return tileDfs(count);
          }
        `,
        c: code`
          static int tileDfs(int* count) {
              int total = 0;
              for (int c = 0; c < 26; c++) {
                  if (count[c] == 0) continue;
                  count[c]--;
                  total += 1 + tileDfs(count);
                  count[c]++;
              }
              return total;
          }

          int numTilePossibilities(const char* tiles) {
              int count[26] = {0};
              for (int i = 0; tiles[i] != '\0'; i++) count[tiles[i] - 'A']++;
              return tileDfs(count);
          }
        `,
        csharp: code`
          public static int NumTilePossibilities(string tiles)
          {
              var count = new int[26];
              foreach (char ch in tiles) count[ch - 'A']++;
              return TileDfs(count);
          }

          static int TileDfs(int[] count)
          {
              int total = 0;
              for (int c = 0; c < 26; c++)
              {
                  if (count[c] == 0) continue;
                  count[c]--;
                  total += 1 + TileDfs(count);
                  count[c]++;
              }
              return total;
          }
        `,
        go: code`
          func numTilePossibilities(tiles string) int {
          	count := make([]int, 26)
          	for i := 0; i < len(tiles); i++ {
          		count[tiles[i]-'A']++
          	}
          	return tileDfs(count)
          }

          func tileDfs(count []int) int {
          	total := 0
          	for c := 0; c < 26; c++ {
          		if count[c] == 0 {
          			continue
          		}
          		count[c]--
          		total += 1 + tileDfs(count)
          		count[c]++
          	}
          	return total
          }
        `,
        kotlin: code`
          fun numTilePossibilities(tiles: String): Int {
              val count = IntArray(26)
              for (ch in tiles) count[ch - 'A']++
              return tileDfs(count)
          }

          fun tileDfs(count: IntArray): Int {
              var total = 0
              for (c in 0 until 26) {
                  if (count[c] == 0) continue
                  count[c]--
                  total += 1 + tileDfs(count)
                  count[c]++
              }
              return total
          }
        `,
        swift: code`
          func numTilePossibilities(_ tiles: String) -> Int {
              var count = [Int](repeating: 0, count: 26)
              for b in tiles.utf8 { count[Int(b) - 65] += 1 }
              func dfs() -> Int {
                  var total = 0
                  for c in 0..<26 where count[c] > 0 {
                      count[c] -= 1
                      total += 1 + dfs()
                      count[c] += 1
                  }
                  return total
              }
              return dfs()
          }
        `,
        rust: code`
          fn numTilePossibilities(tiles: String) -> i32 {
              let mut count = [0i32; 26];
              for b in tiles.bytes() {
                  count[(b - b'A') as usize] += 1;
              }
              tile_dfs(&mut count)
          }

          fn tile_dfs(count: &mut [i32; 26]) -> i32 {
              let mut total = 0;
              for c in 0..26 {
                  if count[c] == 0 {
                      continue;
                  }
                  count[c] -= 1;
                  total += 1 + tile_dfs(count);
                  count[c] += 1;
              }
              total
          }
        `,
        php: code`
          function numTilePossibilities($tiles) {
              $count = array_fill(0, 26, 0);
              $n = strlen($tiles);
              for ($i = 0; $i < $n; $i++) $count[ord($tiles[$i]) - 65]++;
              return tileDfs($count);
          }

          function tileDfs(&$count) {
              $total = 0;
              for ($c = 0; $c < 26; $c++) {
                  if ($count[$c] == 0) continue;
                  $count[$c]--;
                  $total += 1 + tileDfs($count);
                  $count[$c]++;
              }
              return $total;
          }
        `,
        ruby: code`
          def numTilePossibilities(tiles)
            count = Array.new(26, 0)
            tiles.each_byte { |b| count[b - 65] += 1 }
            tile_dfs(count)
          end

          def tile_dfs(count)
            total = 0
            26.times do |c|
              next if count[c] == 0
              count[c] -= 1
              total += 1 + tile_dfs(count)
              count[c] += 1
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Compare Strings by Frequency of the Smallest Character (LC 1170)
  (() => {
    const f = (w: string) => {
      const m = w.split("").sort()[0];
      return w.split("").filter((c) => c === m).length;
    };
    const ref = (queries: string[], words: string[]) => queries.map((q) => words.filter((w) => f(q) < f(w)).length);
    return {
      slug: "compare-strings-by-frequency-of-the-smallest-character",
      title: "Compare Strings by Frequency of the Smallest Character",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Binary Search", "Google", "Oracle"],
      signature: { funcName: "numSmallerByFrequency", params: [{ name: "queries", type: "string[]" as const }, { name: "words", type: "string[]" as const }], returns: "int[]" as const },
      description: describe(
        "For a non-empty string `w`, let `f(w)` be the number of times its **lexicographically smallest** letter occurs in it. For example `f(\"kairo\") = 1` (one `a`) and `f(\"dcce\") = 2` (two `c`s).\n\nYou are given two string arrays `queries` and `words`. For each `queries[i]`, count the words `W` in `words` with `f(queries[i]) < f(W)`.\n\nReturn an integer array whose `i`-th element is that count for `queries[i]`.",
        [
          { in: "queries = [\"kairo\",\"bb\"], words = [\"a\",\"aa\",\"aaa\",\"aaaa\"]", out: "[3,2]", note: "f(\"kairo\") = 1, beaten by f = 2, 3 and 4; f(\"bb\") = 2, beaten by f = 3 and 4." },
          { in: "queries = [\"zz\"], words = [\"yy\",\"x\"]", out: "[0]", note: "f(\"zz\") = 2, f(\"yy\") = 2 and f(\"x\") = 1 — neither is larger." },
        ],
        ["1 <= queries.length <= 2000", "1 <= words.length <= 2000", "1 <= queries[i].length, words[i].length <= 10", "queries[i] and words[i] consist of lowercase English letters"]),
      hints: [
        "Computing `f` takes one pass: track the smallest letter so far and how often it has appeared.",
        "Since every word has length at most 10, `f` is between 1 and 10 — bucket the words by their `f` value.",
        "A suffix sum over the buckets answers \"how many words have `f` greater than x\" in O(1).",
      ],
      editorial: explain({
        idea: "`f` only takes values 1 to 10, so counting words per value and taking suffix sums turns every query into an array lookup.",
        steps: [
          "Compute `f(w)` for each word in one pass per word and increment `bucket[f(w)]`.",
          "Turn the buckets into suffix sums: `atLeast[v] = Σ_{u ≥ v} bucket[u]` for `v` from 10 down to 1 (with `atLeast[11] = 0`).",
          "For each query `q`, the answer is `atLeast[f(q) + 1]`.",
        ],
        why: "A word is counted for query `q` exactly when its `f` value exceeds `f(q)`, i.e. lies in `f(q) + 1 … 10`; the suffix sum adds precisely those buckets. Sorting the `f` values and binary searching works equally well when the range is not small.",
        time: "O((Q + W) · L) where L ≤ 10 is the string length",
        space: "O(1) besides the output",
        pitfalls: [
          "`f` counts the smallest letter, not the most frequent one.",
          "The comparison is strict: words with equal `f` are not counted.",
          "Recomputing `f` for every (query, word) pair is O(Q·W·L) — fine for small inputs, slow at 2000 × 2000.",
        ],
      }),
      examples: [
        { input: '["kairo","bb"]\n["a","aa","aaa","aaaa"]', expectedOutput: "[3,2]" },
        { input: '["zz"]\n["yy","x"]', expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "zyx", "abcdefghijklmnopqrstuvwxyz"]);
        const mk = () => randLower(rng, 1, pick(rng, [3, 10]), pick(rng, [alpha, alpha, "a"]));
        const queries = Array.from({ length: ri(rng, 1, 8) }, mk);
        const words = Array.from({ length: ri(rng, 1, 8) }, mk);
        return { input: `${fmtStrArr(queries)}\n${fmtStrArr(words)}`, expectedOutput: fmtIntArr(ref(queries, words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numSmallerByFrequency(queries: List[str], words: List[str]) -> List[int]:
              def f(w):
                  return w.count(min(w))

              at_least = [0] * 12
              for w in words:
                  at_least[f(w)] += 1
              for v in range(10, -1, -1):
                  at_least[v] += at_least[v + 1]
              return [at_least[f(q) + 1] for q in queries]
        `,
        javascript: code`
          var numSmallerByFrequency = function(queries, words) {
              var f = function(w) {
                  var m = 200, c = 0;
                  for (var i = 0; i < w.length; i++) {
                      var x = w.charCodeAt(i);
                      if (x < m) { m = x; c = 1; } else if (x === m) c++;
                  }
                  return c;
              };
              var atLeast = [];
              for (var k = 0; k < 12; k++) atLeast.push(0);
              for (var i = 0; i < words.length; i++) atLeast[f(words[i])]++;
              for (var v = 10; v >= 0; v--) atLeast[v] += atLeast[v + 1];
              var res = [];
              for (var q = 0; q < queries.length; q++) res.push(atLeast[f(queries[q]) + 1]);
              return res;
          };
        `,
        typescript: code`
          function numSmallerByFrequency(queries: string[], words: string[]): number[] {
              var f = function(w: string): number {
                  var m = 200, c = 0;
                  for (var i = 0; i < w.length; i++) {
                      var x = w.charCodeAt(i);
                      if (x < m) { m = x; c = 1; } else if (x === m) c++;
                  }
                  return c;
              };
              var atLeast: number[] = [];
              for (var k = 0; k < 12; k++) atLeast.push(0);
              for (var i = 0; i < words.length; i++) atLeast[f(words[i])]++;
              for (var v = 10; v >= 0; v--) atLeast[v] += atLeast[v + 1];
              var res: number[] = [];
              for (var q = 0; q < queries.length; q++) res.push(atLeast[f(queries[q]) + 1]);
              return res;
          }
        `,
        java: code`
          public static int[] numSmallerByFrequency(String[] queries, String[] words) {
              int[] atLeast = new int[12];
              for (String w : words) atLeast[smallestFreq(w)]++;
              for (int v = 10; v >= 0; v--) atLeast[v] += atLeast[v + 1];
              int[] res = new int[queries.length];
              for (int i = 0; i < queries.length; i++) res[i] = atLeast[smallestFreq(queries[i]) + 1];
              return res;
          }

          static int smallestFreq(String w) {
              char m = '{';
              int c = 0;
              for (char x : w.toCharArray()) {
                  if (x < m) { m = x; c = 1; } else if (x == m) c++;
              }
              return c;
          }
        `,
        cpp: code`
          int smallestFreq(const string& w) {
              char m = '{';
              int c = 0;
              for (char x : w) {
                  if (x < m) { m = x; c = 1; } else if (x == m) c++;
              }
              return c;
          }

          vector<int> numSmallerByFrequency(vector<string>& queries, vector<string>& words) {
              vector<int> atLeast(12, 0);
              for (const string& w : words) atLeast[smallestFreq(w)]++;
              for (int v = 10; v >= 0; v--) atLeast[v] += atLeast[v + 1];
              vector<int> res;
              for (const string& q : queries) res.push_back(atLeast[smallestFreq(q) + 1]);
              return res;
          }
        `,
        c: code`
          static int smallestFreq(const char* w) {
              char m = '{';
              int c = 0;
              for (int i = 0; w[i] != '\0'; i++) {
                  if (w[i] < m) { m = w[i]; c = 1; } else if (w[i] == m) c++;
              }
              return c;
          }

          int* numSmallerByFrequency(char** queries, int queriesSize, char** words, int wordsSize, int* returnSize) {
              int atLeast[12] = {0};
              for (int i = 0; i < wordsSize; i++) atLeast[smallestFreq(words[i])]++;
              for (int v = 10; v >= 0; v--) atLeast[v] += atLeast[v + 1];
              int* res = (int*)malloc((queriesSize + 1) * sizeof(int));
              for (int i = 0; i < queriesSize; i++) res[i] = atLeast[smallestFreq(queries[i]) + 1];
              *returnSize = queriesSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] NumSmallerByFrequency(string[] queries, string[] words)
          {
              var atLeast = new int[12];
              foreach (var w in words) atLeast[SmallestFreq(w)]++;
              for (int v = 10; v >= 0; v--) atLeast[v] += atLeast[v + 1];
              var res = new int[queries.Length];
              for (int i = 0; i < queries.Length; i++) res[i] = atLeast[SmallestFreq(queries[i]) + 1];
              return res;
          }

          static int SmallestFreq(string w)
          {
              char m = '{';
              int c = 0;
              foreach (char x in w)
              {
                  if (x < m) { m = x; c = 1; }
                  else if (x == m) c++;
              }
              return c;
          }
        `,
        go: code`
          func numSmallerByFrequency(queries []string, words []string) []int {
          	atLeast := make([]int, 12)
          	for _, w := range words {
          		atLeast[smallestFreq(w)]++
          	}
          	for v := 10; v >= 0; v-- {
          		atLeast[v] += atLeast[v+1]
          	}
          	res := make([]int, len(queries))
          	for i, q := range queries {
          		res[i] = atLeast[smallestFreq(q)+1]
          	}
          	return res
          }

          func smallestFreq(w string) int {
          	m := byte('{')
          	c := 0
          	for i := 0; i < len(w); i++ {
          		if w[i] < m {
          			m = w[i]
          			c = 1
          		} else if w[i] == m {
          			c++
          		}
          	}
          	return c
          }
        `,
        kotlin: code`
          fun numSmallerByFrequency(queries: Array<String>, words: Array<String>): IntArray {
              val atLeast = IntArray(12)
              for (w in words) atLeast[smallestFreq(w)]++
              for (v in 10 downTo 0) atLeast[v] += atLeast[v + 1]
              return IntArray(queries.size) { atLeast[smallestFreq(queries[it]) + 1] }
          }

          fun smallestFreq(w: String): Int {
              var m = '{'
              var c = 0
              for (x in w) {
                  if (x < m) {
                      m = x
                      c = 1
                  } else if (x == m) c++
              }
              return c
          }
        `,
        swift: code`
          func numSmallerByFrequency(_ queries: [String], _ words: [String]) -> [Int] {
              func f(_ w: String) -> Int {
                  let m = w.min()!
                  return w.filter { $0 == m }.count
              }
              var atLeast = [Int](repeating: 0, count: 12)
              for w in words { atLeast[f(w)] += 1 }
              for v in stride(from: 10, through: 0, by: -1) { atLeast[v] += atLeast[v + 1] }
              return queries.map { atLeast[f($0) + 1] }
          }
        `,
        rust: code`
          fn numSmallerByFrequency(queries: Vec<String>, words: Vec<String>) -> Vec<i32> {
              fn f(w: &str) -> usize {
                  let m = w.bytes().min().unwrap();
                  w.bytes().filter(|&b| b == m).count()
              }
              let mut at_least = [0i32; 12];
              for w in words.iter() {
                  at_least[f(w)] += 1;
              }
              for v in (0..=10).rev() {
                  at_least[v] += at_least[v + 1];
              }
              queries.iter().map(|q| at_least[f(q) + 1]).collect()
          }
        `,
        php: code`
          function numSmallerByFrequency($queries, $words) {
              $atLeast = array_fill(0, 12, 0);
              foreach ($words as $w) $atLeast[smallestFreq($w)]++;
              for ($v = 10; $v >= 0; $v--) $atLeast[$v] += $atLeast[$v + 1];
              $res = [];
              foreach ($queries as $q) $res[] = $atLeast[smallestFreq($q) + 1];
              return $res;
          }

          function smallestFreq($w) {
              $chars = str_split($w);
              $m = min($chars);
              $c = 0;
              foreach ($chars as $x) if ($x === $m) $c++;
              return $c;
          }
        `,
        ruby: code`
          def numSmallerByFrequency(queries, words)
            at_least = Array.new(12, 0)
            words.each { |w| at_least[smallest_freq(w)] += 1 }
            10.downto(0) { |v| at_least[v] += at_least[v + 1] }
            queries.map { |q| at_least[smallest_freq(q) + 1] }
          end

          def smallest_freq(w)
            w.count(w.chars.min)
          end
        `,
      },
    };
  })(),

  // ── Print Words Vertically (LC 1324) ────────────────────────────
  (() => {
    const ref = (s: string) => {
      const words = s.split(" ");
      const rows = Math.max(...words.map((w) => w.length));
      const out: string[] = [];
      for (let i = 0; i < rows; i++) out.push(words.map((w) => (i < w.length ? w[i] : " ")).join("").replace(/ +$/, ""));
      return out;
    };
    return {
      slug: "print-words-vertically",
      title: "Print Words Vertically",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Simulation", "Microsoft", "Amazon"],
      signature: { funcName: "printVertically", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "The string `s` holds words of uppercase letters separated by single spaces. Write the words vertically, side by side: the `i`-th output string is made of the `i`-th letter of every word, in word order, with a space standing in for a word that is too short to have an `i`-th letter.\n\nThere are as many output strings as the length of the longest word. **Trailing spaces must be removed** from every output string (spaces before a letter stay).",
        [
          { in: "s = \"CODE KAIRO\"", out: "[\"CK\",\"OA\",\"DI\",\"ER\",\" O\"]", note: "`CODE` has no fifth letter, so the last row starts with a space." },
          { in: "s = \"AI PAIR DUEL\"", out: "[\"APD\",\"IAU\",\" IE\",\" RL\"]" },
          { in: "s = \"A BB C\"", out: "[\"ABC\",\" B\"]", note: "The second row is `\" B \"` before its trailing space is removed." },
        ],
        ["1 <= s.length <= 200", "s contains only uppercase English letters and spaces", "Words are separated by exactly one space"]),
      hints: [
        "Split `s` into words and find the longest word's length.",
        "Row `i` takes `word[i]` from each word, or a space if the word is shorter.",
        "Strip only the trailing spaces of each row.",
      ],
      editorial: explain({
        idea: "Treat the words as the columns of a ragged grid and read it row by row, padding missing cells with spaces and trimming each row's right end.",
        steps: [
          "Split `s` on spaces and let `rows` be the length of the longest word.",
          "For `i` from 0 to `rows − 1`, build a string of length `wordCount` whose `j`-th character is `words[j][i]` if it exists and a space otherwise.",
          "Remove the trailing spaces of that string and append it to the answer.",
        ],
        why: "Every letter of every word lands in exactly one row (its index) and one column (its word), so the rows are the vertical reading. Trailing spaces only come from words shorter than the row index at the right end; padding inside a row must stay so the letters keep their columns. No row becomes empty, because the longest word has a letter in every row.",
        time: "O(rows · words)",
        space: "O(rows · words) for the output",
        pitfalls: [
          "Trimming leading spaces too shifts letters into the wrong column.",
          "Forgetting to trim leaves rows such as `\" B \"`.",
          "Words are separated by exactly one space, so splitting on a single space yields no empty words.",
        ],
      }),
      examples: [
        { input: '"CODE KAIRO"', expectedOutput: '["CK","OA","DI","ER"," O"]' },
        { input: '"AI PAIR DUEL"', expectedOutput: '["APD","IAU"," IE"," RL"]' },
        { input: '"A BB C"', expectedOutput: '["ABC"," B"]' },
      ],
      gen: (rng: Rng) => {
        const k = pick(rng, [1, ri(rng, 2, 4), ri(rng, 2, 9)]);
        const maxLen = pick(rng, [1, 3, 6, 9]);
        const words = Array.from({ length: k }, () => randLower(rng, 1, maxLen, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
        const s = words.join(" ");
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def printVertically(s: str) -> List[str]:
              words = s.split(" ")
              rows = max(len(w) for w in words)
              res = []
              for i in range(rows):
                  row = "".join(w[i] if i < len(w) else " " for w in words)
                  res.append(row.rstrip(" "))
              return res
        `,
        javascript: code`
          var printVertically = function(s) {
              var words = s.split(" ");
              var rows = 0;
              for (var k = 0; k < words.length; k++) rows = Math.max(rows, words[k].length);
              var res = [];
              for (var i = 0; i < rows; i++) {
                  var row = "";
                  for (var j = 0; j < words.length; j++) row += i < words[j].length ? words[j][i] : " ";
                  var end = row.length;
                  while (end > 0 && row[end - 1] === " ") end--;
                  res.push(row.substring(0, end));
              }
              return res;
          };
        `,
        typescript: code`
          function printVertically(s: string): string[] {
              var words = s.split(" ");
              var rows = 0;
              for (var k = 0; k < words.length; k++) rows = Math.max(rows, words[k].length);
              var res: string[] = [];
              for (var i = 0; i < rows; i++) {
                  var row = "";
                  for (var j = 0; j < words.length; j++) row += i < words[j].length ? words[j].charAt(i) : " ";
                  var end = row.length;
                  while (end > 0 && row.charAt(end - 1) === " ") end--;
                  res.push(row.substring(0, end));
              }
              return res;
          }
        `,
        java: code`
          public static String[] printVertically(String s) {
              String[] words = s.split(" ");
              int rows = 0;
              for (String w : words) rows = Math.max(rows, w.length());
              String[] res = new String[rows];
              for (int i = 0; i < rows; i++) {
                  StringBuilder sb = new StringBuilder();
                  for (String w : words) sb.append(i < w.length() ? w.charAt(i) : ' ');
                  int end = sb.length();
                  while (end > 0 && sb.charAt(end - 1) == ' ') end--;
                  res[i] = sb.substring(0, end);
              }
              return res;
          }
        `,
        cpp: code`
          vector<string> printVertically(string s) {
              vector<string> words;
              stringstream ss(s);
              string w;
              size_t rows = 0;
              while (ss >> w) {
                  rows = max(rows, w.size());
                  words.push_back(w);
              }
              vector<string> res;
              for (size_t i = 0; i < rows; i++) {
                  string row;
                  for (const string& x : words) row.push_back(i < x.size() ? x[i] : ' ');
                  while (!row.empty() && row.back() == ' ') row.pop_back();
                  res.push_back(row);
              }
              return res;
          }
        `,
        c: code`
          char** printVertically(const char* s, int* returnSize) {
              int n = (int)strlen(s);
              int* st = (int*)malloc((n + 1) * sizeof(int));
              int* ln = (int*)malloc((n + 1) * sizeof(int));
              int wc = 0, rows = 0;
              for (int i = 0; i < n; ) {
                  while (i < n && s[i] == ' ') i++;
                  if (i >= n) break;
                  int j = i;
                  while (j < n && s[j] != ' ') j++;
                  st[wc] = i;
                  ln[wc] = j - i;
                  if (j - i > rows) rows = j - i;
                  wc++;
                  i = j;
              }
              char** res = (char**)malloc((rows + 1) * sizeof(char*));
              for (int r = 0; r < rows; r++) {
                  char* row = (char*)malloc(wc + 1);
                  for (int w = 0; w < wc; w++) row[w] = r < ln[w] ? s[st[w] + r] : ' ';
                  int len = wc;
                  while (len > 0 && row[len - 1] == ' ') len--;
                  row[len] = '\0';
                  res[r] = row;
              }
              free(st);
              free(ln);
              *returnSize = rows;
              return res;
          }
        `,
        csharp: code`
          public static string[] PrintVertically(string s)
          {
              string[] words = s.Split(' ');
              int rows = 0;
              foreach (var w in words) rows = Math.Max(rows, w.Length);
              var res = new string[rows];
              for (int i = 0; i < rows; i++)
              {
                  var sb = new System.Text.StringBuilder();
                  foreach (var w in words) sb.Append(i < w.Length ? w[i] : ' ');
                  res[i] = sb.ToString().TrimEnd(' ');
              }
              return res;
          }
        `,
        go: code`
          func printVertically(s string) []string {
          	words := strings.Split(s, " ")
          	rows := 0
          	for _, w := range words {
          		if len(w) > rows {
          			rows = len(w)
          		}
          	}
          	res := make([]string, 0, rows)
          	for i := 0; i < rows; i++ {
          		row := make([]byte, 0, len(words))
          		for _, w := range words {
          			if i < len(w) {
          				row = append(row, w[i])
          			} else {
          				row = append(row, ' ')
          			}
          		}
          		res = append(res, strings.TrimRight(string(row), " "))
          	}
          	return res
          }
        `,
        kotlin: code`
          fun printVertically(s: String): Array<String> {
              val words = s.split(" ")
              var rows = 0
              for (w in words) rows = maxOf(rows, w.length)
              return Array(rows) { i ->
                  words.map { w -> if (i < w.length) w[i] else ' ' }.joinToString("").trimEnd(' ')
              }
          }
        `,
        swift: code`
          func printVertically(_ s: String) -> [String] {
              let words = s.split(separator: " ").map { Array($0) }
              let rows = words.map { $0.count }.max()!
              var res = [String]()
              for i in 0..<rows {
                  var row = [Character]()
                  for w in words { row.append(i < w.count ? w[i] : " ") }
                  while let last = row.last, last == " " { row.removeLast() }
                  res.append(String(row))
              }
              return res
          }
        `,
        rust: code`
          fn printVertically(s: String) -> Vec<String> {
              let words: Vec<&[u8]> = s.split(' ').map(|w| w.as_bytes()).collect();
              let rows = words.iter().map(|w| w.len()).max().unwrap();
              let mut res: Vec<String> = Vec::new();
              for i in 0..rows {
                  let mut row: Vec<u8> = Vec::new();
                  for w in words.iter() {
                      row.push(if i < w.len() { w[i] } else { b' ' });
                  }
                  while row.last() == Some(&b' ') {
                      row.pop();
                  }
                  res.push(String::from_utf8(row).unwrap());
              }
              res
          }
        `,
        php: code`
          function printVertically($s) {
              $words = explode(" ", $s);
              $rows = 0;
              foreach ($words as $w) $rows = max($rows, strlen($w));
              $res = [];
              for ($i = 0; $i < $rows; $i++) {
                  $row = "";
                  foreach ($words as $w) $row .= $i < strlen($w) ? $w[$i] : " ";
                  $res[] = rtrim($row, " ");
              }
              return $res;
          }
        `,
        ruby: code`
          def printVertically(s)
            words = s.split(" ")
            rows = words.map(&:length).max
            (0...rows).map do |i|
              words.map { |w| i < w.length ? w[i] : " " }.join.rstrip
            end
          end
        `,
      },
    };
  })(),

  // ── Break a Palindrome (LC 1328) ────────────────────────────────
  (() => {
    const isPal = (t: string) => t === t.split("").reverse().join("");
    const ref = (p: string) => {
      let best: string | null = null;
      for (let i = 0; i < p.length; i++) {
        for (let c = 97; c < 123; c++) {
          const ch = String.fromCharCode(c);
          if (ch === p[i]) continue;
          const t = p.slice(0, i) + ch + p.slice(i + 1);
          if (!isPal(t) && (best === null || t < best)) best = t;
        }
      }
      return best === null ? "" : best;
    };
    return {
      slug: "break-a-palindrome",
      title: "Break a Palindrome",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Meta", "Microsoft"],
      signature: { funcName: "breakPalindrome", params: [{ name: "palindrome", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a `palindrome` of lowercase English letters. Replace **exactly one** of its characters with a different lowercase letter so that the result is **not** a palindrome, and among all such results return the lexicographically smallest one.\n\nIf no replacement can break the palindrome, return an empty string.",
        [
          { in: "palindrome = \"kayak\"", out: "aayak", note: "Turning the first `k` into `a` breaks the symmetry and is as small as possible." },
          { in: "palindrome = \"aba\"", out: "abb", note: "The first half is already all `a`; changing the middle keeps a palindrome, so the last letter becomes `b`." },
          { in: "palindrome = \"z\"", out: "\"\"", note: "Every single letter is a palindrome." },
        ],
        ["1 <= palindrome.length <= 1000", "palindrome consists of lowercase English letters", "palindrome reads the same forwards and backwards"]),
      hints: [
        "A one-letter string can never stop being a palindrome.",
        "To make the string as small as possible, lower the earliest letter you can — to `a`.",
        "Only the first half matters (changing the middle of an odd-length string keeps it a palindrome). If the first half is all `a`, the best you can do is change the last letter to `b`.",
      ],
      editorial: explain({
        idea: "The smallest result comes from writing an `a` as early as possible; if that is impossible without keeping the string a palindrome, the least damaging change is to raise the very last letter to `b`.",
        steps: [
          "If the length is 1, return the empty string.",
          "Scan `i` from 0 while `i < n / 2` (the first half, excluding a middle letter). At the first `palindrome[i] != 'a'`, set it to `'a'` and return.",
          "Otherwise every letter outside the middle is `a`: set the last letter to `'b'` and return.",
        ],
        why: "Changing position `i` in the first half breaks the symmetry with its mirror `n − 1 − i`, so the result is not a palindrome; making it `a` at the earliest such position gives the smallest possible string, since any change at an earlier position would have to raise an `a`. Changing the middle letter of an odd-length string keeps it a palindrome. If the first half is all `a`, any change must raise some letter, and raising the last one to `b` keeps the longest possible prefix of `a`s, so it is the smallest.",
        time: "O(n)",
        space: "O(n) for the copy",
        pitfalls: [
          "Changing the middle character of an odd-length palindrome does not break it (`aba` → `aaa`).",
          "`aaaa` must become `aaab`, not `baaa`.",
          "Length 1 has no answer — return an empty string.",
        ],
      }),
      examples: [
        { input: '"kayak"', expectedOutput: "aayak" },
        { input: '"aba"', expectedOutput: "abb" },
        { input: '"z"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const len = pick(rng, [1, ri(rng, 2, 5), ri(rng, 2, 15), ri(rng, 6, 15)]);
        const alpha = pick(rng, ["a", "a", "ab", "aab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const half = randLower(rng, Math.ceil(len / 2), Math.ceil(len / 2), alpha);
        const p = half + half.slice(0, Math.floor(len / 2)).split("").reverse().join("");
        return { input: `"${p}"`, expectedOutput: ref(p) };
      },
      solutions: {
        python: code`
          def breakPalindrome(palindrome: str) -> str:
              n = len(palindrome)
              if n == 1:
                  return ""
              chars = list(palindrome)
              for i in range(n // 2):
                  if chars[i] != "a":
                      chars[i] = "a"
                      return "".join(chars)
              chars[-1] = "b"
              return "".join(chars)
        `,
        javascript: code`
          var breakPalindrome = function(palindrome) {
              var n = palindrome.length;
              if (n === 1) return "";
              for (var i = 0; i < Math.floor(n / 2); i++) {
                  if (palindrome[i] !== "a") return palindrome.substring(0, i) + "a" + palindrome.substring(i + 1);
              }
              return palindrome.substring(0, n - 1) + "b";
          };
        `,
        typescript: code`
          function breakPalindrome(palindrome: string): string {
              var n = palindrome.length;
              if (n === 1) return "";
              for (var i = 0; i < Math.floor(n / 2); i++) {
                  if (palindrome.charAt(i) !== "a") return palindrome.substring(0, i) + "a" + palindrome.substring(i + 1);
              }
              return palindrome.substring(0, n - 1) + "b";
          }
        `,
        java: code`
          public static String breakPalindrome(String palindrome) {
              int n = palindrome.length();
              if (n == 1) return "";
              char[] chars = palindrome.toCharArray();
              for (int i = 0; i < n / 2; i++) {
                  if (chars[i] != 'a') {
                      chars[i] = 'a';
                      return new String(chars);
                  }
              }
              chars[n - 1] = 'b';
              return new String(chars);
          }
        `,
        cpp: code`
          string breakPalindrome(string palindrome) {
              int n = (int)palindrome.size();
              if (n == 1) return "";
              for (int i = 0; i < n / 2; i++) {
                  if (palindrome[i] != 'a') {
                      palindrome[i] = 'a';
                      return palindrome;
                  }
              }
              palindrome[n - 1] = 'b';
              return palindrome;
          }
        `,
        c: code`
          char* breakPalindrome(const char* palindrome) {
              int n = (int)strlen(palindrome);
              char* out = (char*)malloc(n + 1);
              if (n == 1) {
                  out[0] = '\0';
                  return out;
              }
              memcpy(out, palindrome, n + 1);
              for (int i = 0; i < n / 2; i++) {
                  if (out[i] != 'a') {
                      out[i] = 'a';
                      return out;
                  }
              }
              out[n - 1] = 'b';
              return out;
          }
        `,
        csharp: code`
          public static string BreakPalindrome(string palindrome)
          {
              int n = palindrome.Length;
              if (n == 1) return "";
              char[] chars = palindrome.ToCharArray();
              for (int i = 0; i < n / 2; i++)
              {
                  if (chars[i] != 'a')
                  {
                      chars[i] = 'a';
                      return new string(chars);
                  }
              }
              chars[n - 1] = 'b';
              return new string(chars);
          }
        `,
        go: code`
          func breakPalindrome(palindrome string) string {
          	n := len(palindrome)
          	if n == 1 {
          		return ""
          	}
          	b := []byte(palindrome)
          	for i := 0; i < n/2; i++ {
          		if b[i] != 'a' {
          			b[i] = 'a'
          			return string(b)
          		}
          	}
          	b[n-1] = 'b'
          	return string(b)
          }
        `,
        kotlin: code`
          fun breakPalindrome(palindrome: String): String {
              val n = palindrome.length
              if (n == 1) return ""
              val chars = palindrome.toCharArray()
              for (i in 0 until n / 2) {
                  if (chars[i] != 'a') {
                      chars[i] = 'a'
                      return String(chars)
                  }
              }
              chars[n - 1] = 'b'
              return String(chars)
          }
        `,
        swift: code`
          func breakPalindrome(_ palindrome: String) -> String {
              var chars = Array(palindrome)
              let n = chars.count
              if n == 1 { return "" }
              for i in 0..<(n / 2) where chars[i] != "a" {
                  chars[i] = "a"
                  return String(chars)
              }
              chars[n - 1] = "b"
              return String(chars)
          }
        `,
        rust: code`
          fn breakPalindrome(palindrome: String) -> String {
              let mut b = palindrome.into_bytes();
              let n = b.len();
              if n == 1 {
                  return String::new();
              }
              for i in 0..n / 2 {
                  if b[i] != b'a' {
                      b[i] = b'a';
                      return String::from_utf8(b).unwrap();
                  }
              }
              b[n - 1] = b'b';
              String::from_utf8(b).unwrap()
          }
        `,
        php: code`
          function breakPalindrome($palindrome) {
              $n = strlen($palindrome);
              if ($n == 1) return "";
              for ($i = 0; $i < intdiv($n, 2); $i++) {
                  if ($palindrome[$i] !== "a") {
                      $palindrome[$i] = "a";
                      return $palindrome;
                  }
              }
              $palindrome[$n - 1] = "b";
              return $palindrome;
          }
        `,
        ruby: code`
          def breakPalindrome(palindrome)
            n = palindrome.length
            return "" if n == 1
            chars = palindrome.dup
            (0...(n / 2)).each do |i|
              if chars[i] != "a"
                chars[i] = "a"
                return chars
              end
            end
            chars[n - 1] = "b"
            chars
          end
        `,
      },
    };
  })(),

  // ── Rearrange Words in a Sentence (LC 1451) ─────────────────────
  (() => {
    const ref = (text: string) => {
      const words = text.toLowerCase().split(" ").map((w, i) => ({ w, i }));
      words.sort((a, b) => a.w.length - b.w.length || a.i - b.i);
      const s = words.map((x) => x.w).join(" ");
      return s[0].toUpperCase() + s.slice(1);
    };
    return {
      slug: "rearrange-words-in-a-sentence",
      title: "Rearrange Words in a Sentence",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sorting", "Amazon", "Microsoft"],
      signature: { funcName: "arrangeWords", params: [{ name: "text", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A sentence `text` is a list of words separated by single spaces; its first letter is uppercase and every other letter is lowercase.\n\nRearrange the words in increasing order of length. Words of the same length keep the order they had in `text`. Return the new sentence in the same format: first letter uppercase, all other letters lowercase, single spaces between words.",
        [
          { in: "text = \"Keep calm and code on\"", out: "On and keep calm code", note: "Lengths 2, 3, 4, 4, 4 — the three 4-letter words keep their original order." },
          { in: "text = \"Kairo is fun\"", out: "Is fun kairo" },
          { in: "text = \"Hi\"", out: "Hi" },
        ],
        ["1 <= text.length <= 10^5", "text begins with an uppercase letter, followed by lowercase letters and single spaces"]),
      hints: [
        "Lowercase the first letter before rearranging, and capitalise the new first letter afterwards.",
        "You need a sort by length that keeps equal-length words in their original order — a stable sort.",
        "If your language's sort is not stable, sort by the pair (length, original index), or bucket the words by length.",
      ],
      editorial: explain({
        idea: "The task is a stable sort of the words by length, plus fixing the capital letter at both ends of the process.",
        steps: [
          "Lowercase the first character of `text` and split it into words.",
          "Sort the words by length, breaking ties by original position (or use a stable sort).",
          "Join them with single spaces and uppercase the first character.",
        ],
        why: "A stable sort orders by length and leaves words of equal length in their input order, which is exactly the required tie rule. Lowercasing the first word before sorting makes sure the capital does not travel with it, and capitalising after joining puts it on whichever word now comes first.",
        time: "O(n log n) for the sort (O(n) with length buckets)",
        space: "O(n)",
        pitfalls: [
          "Forgetting to lowercase the original first word, so a capital letter appears mid-sentence.",
          "Using an unstable sort (C's `qsort`, PHP 7's `usort`, C#'s `Array.Sort`) without an index tie-break.",
          "Comparing words alphabetically on ties — the rule is original order.",
        ],
      }),
      examples: [
        { input: '"Keep calm and code on"', expectedOutput: "On and keep calm code" },
        { input: '"Kairo is fun"', expectedOutput: "Is fun kairo" },
        { input: '"Hi"', expectedOutput: "Hi" },
      ],
      gen: (rng: Rng) => {
        const k = pick(rng, [1, ri(rng, 2, 4), ri(rng, 2, 10)]);
        const maxLen = pick(rng, [2, 4, 7]);
        const words = Array.from({ length: k }, () => randLower(rng, 1, maxLen));
        const t = words.join(" ");
        const text = t[0].toUpperCase() + t.slice(1);
        return { input: `"${text}"`, expectedOutput: ref(text) };
      },
      solutions: {
        python: code`
          def arrangeWords(text: str) -> str:
              words = text.lower().split(" ")
              words.sort(key=len)
              s = " ".join(words)
              return s[0].upper() + s[1:]
        `,
        javascript: code`
          var arrangeWords = function(text) {
              var words = text.toLowerCase().split(" ");
              var idx = [];
              for (var i = 0; i < words.length; i++) idx.push(i);
              idx.sort(function(a, b) { return words[a].length - words[b].length || a - b; });
              var out = [];
              for (var j = 0; j < idx.length; j++) out.push(words[idx[j]]);
              var s = out.join(" ");
              return s.charAt(0).toUpperCase() + s.substring(1);
          };
        `,
        typescript: code`
          function arrangeWords(text: string): string {
              var words = text.toLowerCase().split(" ");
              var idx: number[] = [];
              for (var i = 0; i < words.length; i++) idx.push(i);
              idx.sort(function(a, b) { return words[a].length - words[b].length || a - b; });
              var out: string[] = [];
              for (var j = 0; j < idx.length; j++) out.push(words[idx[j]]);
              var s = out.join(" ");
              return s.charAt(0).toUpperCase() + s.substring(1);
          }
        `,
        java: code`
          public static String arrangeWords(String text) {
              String[] words = text.toLowerCase().split(" ");
              Arrays.sort(words, (a, b) -> a.length() - b.length());
              String s = String.join(" ", words);
              return Character.toUpperCase(s.charAt(0)) + s.substring(1);
          }
        `,
        cpp: code`
          string arrangeWords(string text) {
              for (char& c : text) if (c >= 'A' && c <= 'Z') c = (char)(c - 'A' + 'a');
              vector<string> words;
              stringstream ss(text);
              string w;
              while (ss >> w) words.push_back(w);
              stable_sort(words.begin(), words.end(), [](const string& a, const string& b) { return a.size() < b.size(); });
              string s;
              for (size_t i = 0; i < words.size(); i++) {
                  if (i > 0) s += ' ';
                  s += words[i];
              }
              s[0] = (char)(s[0] - 'a' + 'A');
              return s;
          }
        `,
        c: code`
          typedef struct { const char* p; int len; int idx; } ArrangeWord;

          static int arrangeCmp(const void* x, const void* y) {
              const ArrangeWord* a = (const ArrangeWord*)x;
              const ArrangeWord* b = (const ArrangeWord*)y;
              if (a->len != b->len) return a->len - b->len;
              return a->idx - b->idx;
          }

          char* arrangeWords(const char* text) {
              int n = (int)strlen(text);
              ArrangeWord* words = (ArrangeWord*)malloc((n + 1) * sizeof(ArrangeWord));
              int wc = 0;
              for (int i = 0; i < n; ) {
                  int j = i;
                  while (j < n && text[j] != ' ') j++;
                  words[wc].p = text + i;
                  words[wc].len = j - i;
                  words[wc].idx = wc;
                  wc++;
                  i = j + 1;
              }
              qsort(words, wc, sizeof(ArrangeWord), arrangeCmp);
              char* out = (char*)malloc(n + 1);
              int q = 0;
              for (int k = 0; k < wc; k++) {
                  if (k > 0) out[q++] = ' ';
                  for (int t = 0; t < words[k].len; t++) {
                      char c = words[k].p[t];
                      if (c >= 'A' && c <= 'Z') c = (char)(c - 'A' + 'a');
                      out[q++] = c;
                  }
              }
              out[q] = '\0';
              out[0] = (char)(out[0] - 'a' + 'A');
              free(words);
              return out;
          }
        `,
        csharp: code`
          public static string ArrangeWords(string text)
          {
              var words = text.ToLowerInvariant().Split(' ');
              string s = string.Join(" ", words.OrderBy(w => w.Length));
              return char.ToUpperInvariant(s[0]) + s.Substring(1);
          }
        `,
        go: code`
          func arrangeWords(text string) string {
          	words := strings.Split(strings.ToLower(text), " ")
          	sort.SliceStable(words, func(i, j int) bool { return len(words[i]) < len(words[j]) })
          	s := strings.Join(words, " ")
          	return strings.ToUpper(s[:1]) + s[1:]
          }
        `,
        kotlin: code`
          fun arrangeWords(text: String): String {
              val s = text.toLowerCase().split(" ").sortedBy { it.length }.joinToString(" ")
              return s.substring(0, 1).toUpperCase() + s.substring(1)
          }
        `,
        swift: code`
          func arrangeWords(_ text: String) -> String {
              let words: [String] = text.lowercased().split(separator: " ").map { String($0) }
              var lengths: [Int] = []
              for w in words { lengths.append(w.count) }
              let order: [Int] = Array(0..<words.count).sorted { (a: Int, b: Int) -> Bool in
                  if lengths[a] != lengths[b] { return lengths[a] < lengths[b] }
                  return a < b
              }
              var parts: [String] = []
              for i in order { parts.append(words[i]) }
              let s: String = parts.joined(separator: " ")
              if s.isEmpty { return s }
              let first: String = String(s.prefix(1)).uppercased()
              let rest: String = String(s.dropFirst())
              return first + rest
          }
        `,
        rust: code`
          fn arrangeWords(text: String) -> String {
              let lower = text.to_lowercase();
              let mut words: Vec<&str> = lower.split(' ').collect();
              words.sort_by_key(|w| w.len());
              let s = words.join(" ");
              let mut out = s[..1].to_uppercase();
              out.push_str(&s[1..]);
              out
          }
        `,
        php: code`
          function arrangeWords($text) {
              $words = explode(" ", strtolower($text));
              $idx = range(0, count($words) - 1);
              usort($idx, function ($a, $b) use ($words) {
                  $d = strlen($words[$a]) - strlen($words[$b]);
                  return $d != 0 ? $d : $a - $b;
              });
              $out = [];
              foreach ($idx as $i) $out[] = $words[$i];
              return ucfirst(implode(" ", $out));
          }
        `,
        ruby: code`
          def arrangeWords(text)
            words = text.downcase.split(" ")
            s = words.each_with_index.sort_by { |w, i| [w.length, i] }.map(&:first).join(" ")
            s[0].upcase + s[1..-1]
          end
        `,
      },
    };
  })(),

  // ── Check If a String Contains All Binary Codes of Size K (LC 1461)
  (() => {
    const ref = (s: string, k: number) => {
      const seen = new Set<string>();
      for (let i = 0; i + k <= s.length; i++) seen.add(s.slice(i, i + k));
      return seen.size === 2 ** k;
    };
    // Binary de Bruijn sequence by the "prefer ones" rule: every k-bit code exactly once.
    const deBruijn = (k: number) => {
      let s = "0".repeat(k);
      const seen = new Set([s]);
      for (;;) {
        const tail = s.slice(s.length - k + 1);
        if (!seen.has(tail + "1")) { s += "1"; seen.add(tail + "1"); }
        else if (!seen.has(tail + "0")) { s += "0"; seen.add(tail + "0"); }
        else break;
      }
      return s;
    };
    return {
      slug: "check-if-a-string-contains-all-binary-codes-of-size-k",
      title: "Check If a String Contains All Binary Codes of Size K",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Bit Manipulation", "Rolling Hash", "Google", "Amazon"],
      signature: { funcName: "hasAllCodes", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given a binary string `s` and an integer `k`, return `true` if **every** binary code of length `k` — all `2^k` strings of `k` zeros and ones — appears in `s` as a substring. Otherwise return `false`.",
        [
          { in: "s = \"00110100\", k = 2", out: "true", note: "`00`, `01`, `11` and `10` all appear." },
          { in: "s = \"0101\", k = 2", out: "false", note: "`00` and `11` are missing." },
          { in: "s = \"10\", k = 1", out: "true" },
        ],
        ["1 <= s.length <= 5 * 10^5", "s[i] is '0' or '1'", "1 <= k <= 20"]),
      hints: [
        "`s` has only `n − k + 1` substrings of length `k`; if that is fewer than `2^k`, the answer is `false` at once.",
        "Collect the distinct length-`k` windows and compare their number with `2^k`.",
        "Read each window as a `k`-bit number and update it in O(1) when the window slides: shift left, add the new bit, mask to `k` bits.",
      ],
      editorial: explain({
        idea: "All codes are present exactly when the set of length-`k` windows has `2^k` elements; a rolling `k`-bit integer makes each window O(1) to compute and a boolean array of size `2^k` records them.",
        steps: [
          "Let `need = 2^k`. If `n − k + 1 < need`, return `false`.",
          "Keep `cur`, the value of the last `k` bits read, and a boolean array `seen` of size `need`.",
          "For each bit, set `cur = ((cur << 1) | bit) & (need − 1)`; once at least `k` bits have been read, mark `seen[cur]` and count it if it was new.",
          "Return `true` as soon as the count reaches `need`, or `false` at the end.",
        ],
        why: "Masking to the low `k` bits keeps `cur` equal to the window ending at the current position, read as a binary number, so distinct windows map to distinct indices of `seen`. The early length check is not only a speed-up — it also keeps the array no larger than the string itself.",
        time: "O(n)",
        space: "O(2^k), at most O(n) thanks to the early check",
        pitfalls: [
          "Hashing substrings costs O(k) each; the rolling integer avoids that.",
          "Counting windows before `k` bits have been read marks codes that do not exist.",
          "`k` may exceed `n` — then there are no windows at all.",
        ],
      }),
      examples: [
        { input: '"00110100"\n2', expectedOutput: "true" },
        { input: '"0101"\n2', expectedOutput: "false" },
        { input: '"10"\n1', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 4);
        let s: string, k: number;
        if (mode <= 1) {
          k = ri(rng, 1, 5);
          s = randLower(rng, 0, 6, "01") + deBruijn(k) + randLower(rng, 0, 6, "01");
          if (mode === 1) {
            const p = ri(rng, 0, s.length - 1);
            s = s.slice(0, p) + (s[p] === "0" ? "1" : "0") + s.slice(p + 1);
          }
        } else if (mode <= 3) {
          k = ri(rng, 1, 4);
          s = randLower(rng, 1, 60, pick(rng, ["01", "01", "0", "1"]));
        } else {
          k = ri(rng, 6, 20);
          s = randLower(rng, 1, 70, "01");
        }
        return { input: `"${s}"\n${k}`, expectedOutput: bool(ref(s, k)) };
      },
      solutions: {
        python: code`
          def hasAllCodes(s: str, k: int) -> bool:
              need = 1 << k
              if len(s) - k + 1 < need:
                  return False
              return len({s[i:i + k] for i in range(len(s) - k + 1)}) == need
        `,
        javascript: code`
          var hasAllCodes = function(s, k) {
              var need = 1 << k;
              if (s.length - k + 1 < need) return false;
              var seen = new Uint8Array(need);
              var mask = need - 1, cur = 0, count = 0;
              for (var i = 0; i < s.length; i++) {
                  cur = ((cur << 1) | (s.charCodeAt(i) - 48)) & mask;
                  if (i >= k - 1 && seen[cur] === 0) {
                      seen[cur] = 1;
                      count++;
                      if (count === need) return true;
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function hasAllCodes(s: string, k: number): boolean {
              var need = 1 << k;
              if (s.length - k + 1 < need) return false;
              var seen: boolean[] = [];
              for (var j = 0; j < need; j++) seen.push(false);
              var mask = need - 1, cur = 0, count = 0;
              for (var i = 0; i < s.length; i++) {
                  cur = ((cur << 1) | (s.charCodeAt(i) - 48)) & mask;
                  if (i >= k - 1 && !seen[cur]) {
                      seen[cur] = true;
                      count++;
                      if (count === need) return true;
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean hasAllCodes(String s, int k) {
              int need = 1 << k;
              if (s.length() - k + 1 < need) return false;
              boolean[] seen = new boolean[need];
              int mask = need - 1, cur = 0, count = 0;
              for (int i = 0; i < s.length(); i++) {
                  cur = ((cur << 1) | (s.charAt(i) - '0')) & mask;
                  if (i >= k - 1 && !seen[cur]) {
                      seen[cur] = true;
                      if (++count == need) return true;
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool hasAllCodes(string s, int k) {
              int need = 1 << k;
              if ((int)s.size() - k + 1 < need) return false;
              vector<bool> seen(need, false);
              int mask = need - 1, cur = 0, count = 0;
              for (int i = 0; i < (int)s.size(); i++) {
                  cur = ((cur << 1) | (s[i] - '0')) & mask;
                  if (i >= k - 1 && !seen[cur]) {
                      seen[cur] = true;
                      if (++count == need) return true;
                  }
              }
              return false;
          }
        `,
        c: code`
          bool hasAllCodes(const char* s, int k) {
              int n = (int)strlen(s);
              int need = 1 << k;
              if (n - k + 1 < need) return false;
              char* seen = (char*)calloc(need, 1);
              int mask = need - 1, cur = 0, count = 0;
              bool ok = false;
              for (int i = 0; i < n; i++) {
                  cur = ((cur << 1) | (s[i] - '0')) & mask;
                  if (i >= k - 1 && !seen[cur]) {
                      seen[cur] = 1;
                      if (++count == need) { ok = true; break; }
                  }
              }
              free(seen);
              return ok;
          }
        `,
        csharp: code`
          public static bool HasAllCodes(string s, int k)
          {
              int need = 1 << k;
              if (s.Length - k + 1 < need) return false;
              var seen = new bool[need];
              int mask = need - 1, cur = 0, count = 0;
              for (int i = 0; i < s.Length; i++)
              {
                  cur = ((cur << 1) | (s[i] - '0')) & mask;
                  if (i >= k - 1 && !seen[cur])
                  {
                      seen[cur] = true;
                      if (++count == need) return true;
                  }
              }
              return false;
          }
        `,
        go: code`
          func hasAllCodes(s string, k int) bool {
          	need := 1 << uint(k)
          	if len(s)-k+1 < need {
          		return false
          	}
          	seen := make([]bool, need)
          	mask, cur, count := need-1, 0, 0
          	for i := 0; i < len(s); i++ {
          		cur = ((cur << 1) | int(s[i]-'0')) & mask
          		if i >= k-1 && !seen[cur] {
          			seen[cur] = true
          			count++
          			if count == need {
          				return true
          			}
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          fun hasAllCodes(s: String, k: Int): Boolean {
              val need = 1 shl k
              if (s.length - k + 1 < need) return false
              val seen = BooleanArray(need)
              val mask = need - 1
              var cur = 0
              var count = 0
              for (i in s.indices) {
                  cur = ((cur shl 1) or (s[i] - '0')) and mask
                  if (i >= k - 1 && !seen[cur]) {
                      seen[cur] = true
                      count++
                      if (count == need) return true
                  }
              }
              return false
          }
        `,
        swift: code`
          func hasAllCodes(_ s: String, _ k: Int) -> Bool {
              let b = Array(s.utf8)
              let need = 1 << k
              if b.count - k + 1 < need { return false }
              var seen = [Bool](repeating: false, count: need)
              let mask = need - 1
              var cur = 0, count = 0
              for i in 0..<b.count {
                  cur = ((cur << 1) | (Int(b[i]) - 48)) & mask
                  if i >= k - 1 && !seen[cur] {
                      seen[cur] = true
                      count += 1
                      if count == need { return true }
                  }
              }
              return false
          }
        `,
        rust: code`
          fn hasAllCodes(s: String, k: i32) -> bool {
              let b = s.as_bytes();
              let k = k as usize;
              let need: usize = 1 << k;
              if b.len() + 1 < k + need {
                  return false;
              }
              let mut seen = vec![false; need];
              let mask = need - 1;
              let mut cur: usize = 0;
              let mut count = 0;
              for i in 0..b.len() {
                  cur = ((cur << 1) | (b[i] - b'0') as usize) & mask;
                  if i + 1 >= k && !seen[cur] {
                      seen[cur] = true;
                      count += 1;
                      if count == need {
                          return true;
                      }
                  }
              }
              false
          }
        `,
        php: code`
          function hasAllCodes($s, $k) {
              $n = strlen($s);
              $need = 1 << $k;
              if ($n - $k + 1 < $need) return false;
              $seen = [];
              $mask = $need - 1;
              $cur = 0;
              for ($i = 0; $i < $n; $i++) {
                  $cur = (($cur << 1) | (ord($s[$i]) - 48)) & $mask;
                  if ($i >= $k - 1) $seen[$cur] = true;
              }
              return count($seen) == $need;
          }
        `,
        ruby: code`
          def hasAllCodes(s, k)
            need = 1 << k
            return false if s.length - k + 1 < need
            seen = {}
            (0..s.length - k).each { |i| seen[s[i, k]] = true }
            seen.size == need
          end
        `,
      },
    };
  })(),

  // ── Number of Substrings With Only 1s (LC 1513) ─────────────────
  (() => {
    const MOD = 1_000_000_007;
    const ref = (s: string) => {
      if (s.length <= 60) {
        let c = 0;
        for (let i = 0; i < s.length; i++) for (let j = i; j < s.length && s[j] === "1"; j++) c++;
        return c % MOD;
      }
      let total = 0n;
      for (const run of s.split("0")) total += BigInt(run.length) * BigInt(run.length + 1) / 2n;
      return Number(total % BigInt(MOD));
    };
    return {
      slug: "number-of-substrings-with-only-1s",
      title: "Number of Substrings With Only 1s",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Amazon", "Google"],
      signature: { funcName: "numSub", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a binary string `s`, return the number of its substrings that consist only of `1` characters. Substrings at different positions count separately even when they are equal.\n\nThe answer may be large, so return it modulo `10^9 + 7`.",
        [
          { in: "s = \"1101111\"", out: "13", note: "The run `11` has 3 such substrings and the run `1111` has 10." },
          { in: "s = \"000\"", out: "0" },
          { in: "s = \"1111111111\"", out: "55" },
        ],
        ["1 <= s.length <= 10^5", "s[i] is '0' or '1'"]),
      hints: [
        "Every all-ones substring lies inside one maximal run of ones.",
        "A run of length `L` contains `L·(L+1)/2` all-ones substrings.",
        "Equivalently, scan once: the number of all-ones substrings ending at position `i` is the current run length; add it up modulo 10^9 + 7.",
      ],
      editorial: explain({
        idea: "Count the all-ones substrings by their right end: those ending at `i` number exactly the length of the run of ones ending at `i`.",
        steps: [
          "Keep `run`, the number of consecutive `1`s ending at the current index (reset to 0 on a `0`).",
          "At each `1`, increment `run` and add it to the answer, reducing modulo 10^9 + 7.",
          "Return the answer.",
        ],
        why: "An all-ones substring ending at `i` starts somewhere inside the run that ends at `i`, and every such start works, so there are `run` of them; summing over all right ends counts every substring once. Summed over a whole run this is `1 + 2 + … + L = L(L+1)/2`. The answer before reduction can reach about 5·10^9, beyond 32 bits, but each step adds at most 10^5 to a value below 10^9 + 7, so reducing as you go keeps every intermediate under 2^31.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Computing `L·(L+1)/2` in 32-bit arithmetic overflows for `L` near 10^5.",
          "Forgetting the modulus: a string of 10^5 ones has 5 000 050 000 such substrings.",
          "Resetting the run on a `0` but forgetting the final run at the end of the string (in the run-length formulation).",
        ],
      }),
      examples: [
        { input: '"1101111"', expectedOutput: "13" },
        { input: '"000"', expectedOutput: "0" },
        { input: '"1111111111"', expectedOutput: "55" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.001) {
          // A rare long run, so the modulus is exercised (46 341 ones already pass 10^9 + 7).
          const len = ri(rng, 46000, 70000);
          const cut = rng() < 0.5 ? -1 : ri(rng, 0, len - 1);
          s = "1".repeat(len);
          if (cut >= 0) s = s.slice(0, cut) + "0" + s.slice(cut + 1);
        } else {
          const ones = pick(rng, ["01", "011", "0111111", "1", "0"]);
          s = randLower(rng, 1, pick(rng, [8, 30, 60]), ones);
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def numSub(s: str) -> int:
              total = 0
              for run in s.split("0"):
                  n = len(run)
                  total += n * (n + 1) // 2
              return total % 1000000007
        `,
        javascript: code`
          var numSub = function(s) {
              var MOD = 1000000007, ans = 0, run = 0;
              for (var i = 0; i < s.length; i++) {
                  if (s.charCodeAt(i) === 49) {
                      run++;
                      ans = (ans + run) % MOD;
                  } else {
                      run = 0;
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function numSub(s: string): number {
              var MOD = 1000000007, ans = 0, run = 0;
              for (var i = 0; i < s.length; i++) {
                  if (s.charCodeAt(i) === 49) {
                      run++;
                      ans = (ans + run) % MOD;
                  } else {
                      run = 0;
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int numSub(String s) {
              final int MOD = 1000000007;
              int ans = 0, run = 0;
              for (int i = 0; i < s.length(); i++) {
                  if (s.charAt(i) == '1') {
                      run++;
                      ans = (ans + run) % MOD;
                  } else {
                      run = 0;
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          int numSub(string s) {
              const int MOD = 1000000007;
              int ans = 0, run = 0;
              for (char c : s) {
                  if (c == '1') {
                      run++;
                      ans = (ans + run) % MOD;
                  } else {
                      run = 0;
                  }
              }
              return ans;
          }
        `,
        c: code`
          int numSub(const char* s) {
              const int MOD = 1000000007;
              int ans = 0, run = 0;
              for (int i = 0; s[i] != '\0'; i++) {
                  if (s[i] == '1') {
                      run++;
                      ans = (ans + run) % MOD;
                  } else {
                      run = 0;
                  }
              }
              return ans;
          }
        `,
        csharp: code`
          public static int NumSub(string s)
          {
              const int MOD = 1000000007;
              int ans = 0, run = 0;
              foreach (char c in s)
              {
                  if (c == '1')
                  {
                      run++;
                      ans = (ans + run) % MOD;
                  }
                  else run = 0;
              }
              return ans;
          }
        `,
        go: code`
          func numSub(s string) int {
          	const MOD = 1000000007
          	ans, run := 0, 0
          	for i := 0; i < len(s); i++ {
          		if s[i] == '1' {
          			run++
          			ans = (ans + run) % MOD
          		} else {
          			run = 0
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun numSub(s: String): Int {
              val MOD = 1000000007
              var ans = 0
              var run = 0
              for (c in s) {
                  if (c == '1') {
                      run++
                      ans = (ans + run) % MOD
                  } else {
                      run = 0
                  }
              }
              return ans
          }
        `,
        swift: code`
          func numSub(_ s: String) -> Int {
              let MOD = 1000000007
              var ans = 0, run = 0
              for b in s.utf8 {
                  if b == 49 {
                      run += 1
                      ans = (ans + run) % MOD
                  } else {
                      run = 0
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn numSub(s: String) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let mut ans: i64 = 0;
              let mut run: i64 = 0;
              for b in s.bytes() {
                  if b == b'1' {
                      run += 1;
                      ans = (ans + run) % MOD;
                  } else {
                      run = 0;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function numSub($s) {
              $total = 0;
              foreach (explode("0", $s) as $run) {
                  $n = strlen($run);
                  $total += intdiv($n * ($n + 1), 2);
              }
              return $total % 1000000007;
          }
        `,
        ruby: code`
          def numSub(s)
            s.split("0").sum { |run| run.length * (run.length + 1) / 2 } % 1_000_000_007
          end
        `,
      },
    };
  })(),

  // ── Minimum Suffix Flips (LC 1529) ──────────────────────────────
  (() => {
    const ref = (target: string) => {
      const s = new Array(target.length).fill("0");
      let ops = 0;
      for (let i = 0; i < target.length; i++) {
        if (s[i] !== target[i]) {
          ops++;
          for (let j = i; j < s.length; j++) s[j] = s[j] === "0" ? "1" : "0";
        }
      }
      return ops;
    };
    return {
      slug: "minimum-suffix-flips",
      title: "Minimum Suffix Flips",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Google"],
      signature: { funcName: "minFlips", params: [{ name: "target", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A binary string `s` of length `n` starts as all zeros. In one operation you pick an index `i` and flip every bit of `s` from index `i` to the end (each `0` becomes `1` and each `1` becomes `0`).\n\nGiven the binary string `target` of length `n`, return the minimum number of operations needed to turn `s` into `target`.",
        [
          { in: "target = \"00110\"", out: "2", note: "Flip from index 2 (`00111`), then from index 4 (`00110`)." },
          { in: "target = \"101\"", out: "3", note: "Flip from 0 (`111`), from 1 (`100`), from 2 (`101`)." },
          { in: "target = \"000\"", out: "0" },
        ],
        ["1 <= target.length <= 10^5", "target[i] is '0' or '1'"]),
      hints: [
        "Work left to right: once a prefix matches, only flips starting later can keep it intact.",
        "The bit at index `i` is decided by how many flips started at or before `i`.",
        "A flip is needed exactly where `target` changes value — counting from an imaginary `0` before index 0.",
      ],
      editorial: explain({
        idea: "Scanning left to right, the current bit of `s` equals the parity of the flips made so far; a new flip is forced exactly when `target[i]` differs from `target[i − 1]` (with `target[−1] = 0`).",
        steps: [
          "Set `prev = '0'` and `ops = 0`.",
          "For each character `c` of `target`: if `c != prev`, increment `ops` and set `prev = c`.",
          "Return `ops`.",
        ],
        why: "Flips starting after `i` never affect index `i`, so after fixing indices `0…i−1` the bit at `i` equals the bit at `i − 1` (both have seen the same flips) — which matches `target[i − 1]`. If `target[i]` differs, a flip starting exactly at `i` is unavoidable, and it is enough; if they agree, flipping at `i` would only have to be undone later. Hence every change point costs exactly one operation and nothing else does.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting that `s` starts at `0`: a leading `1` in `target` costs a flip.",
          "Simulating the flips literally is O(n²) — too slow for 10^5.",
          "Counting the ones instead of the changes between neighbours.",
        ],
      }),
      examples: [
        { input: '"00110"', expectedOutput: "2" },
        { input: '"101"', expectedOutput: "3" },
        { input: '"000"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const target = randLower(rng, 1, pick(rng, [5, 20, 60]), pick(rng, ["01", "01", "0001", "0111", "0", "1"]));
        return { input: `"${target}"`, expectedOutput: String(ref(target)) };
      },
      solutions: {
        python: code`
          def minFlips(target: str) -> int:
              ops = 0
              prev = "0"
              for c in target:
                  if c != prev:
                      ops += 1
                      prev = c
              return ops
        `,
        javascript: code`
          var minFlips = function(target) {
              var ops = 0, prev = "0";
              for (var i = 0; i < target.length; i++) {
                  if (target[i] !== prev) {
                      ops++;
                      prev = target[i];
                  }
              }
              return ops;
          };
        `,
        typescript: code`
          function minFlips(target: string): number {
              var ops = 0, prev = "0";
              for (var i = 0; i < target.length; i++) {
                  var c = target.charAt(i);
                  if (c !== prev) {
                      ops++;
                      prev = c;
                  }
              }
              return ops;
          }
        `,
        java: code`
          public static int minFlips(String target) {
              int ops = 0;
              char prev = '0';
              for (int i = 0; i < target.length(); i++) {
                  char c = target.charAt(i);
                  if (c != prev) {
                      ops++;
                      prev = c;
                  }
              }
              return ops;
          }
        `,
        cpp: code`
          int minFlips(string target) {
              int ops = 0;
              char prev = '0';
              for (char c : target) {
                  if (c != prev) {
                      ops++;
                      prev = c;
                  }
              }
              return ops;
          }
        `,
        c: code`
          int minFlips(const char* target) {
              int ops = 0;
              char prev = '0';
              for (int i = 0; target[i] != '\0'; i++) {
                  if (target[i] != prev) {
                      ops++;
                      prev = target[i];
                  }
              }
              return ops;
          }
        `,
        csharp: code`
          public static int MinFlips(string target)
          {
              int ops = 0;
              char prev = '0';
              foreach (char c in target)
              {
                  if (c != prev)
                  {
                      ops++;
                      prev = c;
                  }
              }
              return ops;
          }
        `,
        go: code`
          func minFlips(target string) int {
          	ops := 0
          	prev := byte('0')
          	for i := 0; i < len(target); i++ {
          		if target[i] != prev {
          			ops++
          			prev = target[i]
          		}
          	}
          	return ops
          }
        `,
        kotlin: code`
          fun minFlips(target: String): Int {
              var ops = 0
              var prev = '0'
              for (c in target) {
                  if (c != prev) {
                      ops++
                      prev = c
                  }
              }
              return ops
          }
        `,
        swift: code`
          func minFlips(_ target: String) -> Int {
              var ops = 0
              var prev: UInt8 = 48
              for b in target.utf8 where b != prev {
                  ops += 1
                  prev = b
              }
              return ops
          }
        `,
        rust: code`
          fn minFlips(target: String) -> i32 {
              let mut ops = 0;
              let mut prev = b'0';
              for b in target.bytes() {
                  if b != prev {
                      ops += 1;
                      prev = b;
                  }
              }
              ops
          }
        `,
        php: code`
          function minFlips($target) {
              $ops = 0;
              $prev = "0";
              $n = strlen($target);
              for ($i = 0; $i < $n; $i++) {
                  if ($target[$i] !== $prev) {
                      $ops++;
                      $prev = $target[$i];
                  }
              }
              return $ops;
          }
        `,
        ruby: code`
          def minFlips(target)
            ops = 0
            prev = "0"
            target.each_char do |c|
              if c != prev
                ops += 1
                prev = c
              end
            end
            ops
          end
        `,
      },
    };
  })(),

  // ── Find Kth Bit in Nth Binary String (LC 1545) ─────────────────
  (() => {
    let s20: string | null = null;
    const ref = (_n: number, k: number) => {
      // S(n) is a prefix of S(n + 1), so S(20) answers every query.
      if (s20 === null) {
        let s = "0";
        for (let i = 2; i <= 20; i++) {
          let inv = "";
          for (let j = s.length - 1; j >= 0; j--) inv += s[j] === "0" ? "1" : "0";
          s = s + "1" + inv;
        }
        s20 = s;
      }
      return s20[k - 1];
    };
    return {
      slug: "find-kth-bit-in-nth-binary-string",
      title: "Find Kth Bit in Nth Binary String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Recursion", "Simulation", "Amazon", "Google"],
      signature: { funcName: "findKthBit", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Binary strings `S1, S2, …` are built as follows:\n\n- `S1 = \"0\"`;\n- `Si = S(i−1) + \"1\" + reverse(invert(S(i−1)))` for `i > 1`, where `invert` turns every `0` into `1` and every `1` into `0`.\n\nSo `S2 = \"011\"`, `S3 = \"0111001\"` and `S4 = \"011100110110001\"`.\n\nGiven `n` and `k`, return the `k`-th bit (1-indexed) of `Sn` as a one-character string, `\"0\"` or `\"1\"`.",
        [
          { in: "n = 3, k = 5", out: "0", note: "S3 = 0111001; its fifth bit is 0." },
          { in: "n = 4, k = 10", out: "1" },
          { in: "n = 1, k = 1", out: "0" },
        ],
        ["1 <= n <= 20", "1 <= k <= 2^n - 1"]),
      hints: [
        "`Sn` has length `2^n − 1`, and its middle bit (position `2^(n−1)`) is always `1`.",
        "Positions left of the middle are just `S(n−1)`.",
        "A position `k` right of the middle mirrors position `2^n − k` of `S(n−1)`, inverted. Walk down `n` while tracking whether an odd number of inversions has happened.",
      ],
      editorial: explain({
        idea: "Each `Sn` is `S(n−1)`, a middle `1`, and a mirrored inverted copy of `S(n−1)`, so the `k`-th bit can be traced back to a position in a shorter string without building anything.",
        steps: [
          "Keep a flag `flipped = false`.",
          "While `n > 1`: let `mid = 2^(n−1)`. If `k == mid`, the bit is `1` (inverted if `flipped`). If `k > mid`, replace `k` by `2^n − k` and toggle `flipped`. Then decrease `n`.",
          "When `n` reaches 1 the bit is `0` (inverted if `flipped`).",
        ],
        why: "The right part of `Sn` holds `S(n−1)` reversed, so position `mid + j` corresponds to position `mid − j = 2^n − k` of `S(n−1)`, with its value inverted; the left part needs no change. Every step halves the string, so after at most `n − 1` steps the position is either a middle bit or the single bit of `S1`, and the number of inversions picked up along the way decides the final value.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Building `S20` costs about a million characters per query — fine once, wasteful per call.",
          "The mirror index is `2^n − k`, not `2^n − k − 1` or `k − mid`.",
          "The answer is a string (`\"0\"`/`\"1\"`), not a number.",
        ],
      }),
      examples: [
        { input: "3\n5", expectedOutput: "0" },
        { input: "4\n10", expectedOutput: "1" },
        { input: "1\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 1, 6), ri(rng, 1, 20), ri(rng, 15, 20)]);
        const len = 2 ** n - 1;
        const k = pick(rng, [1, len, 2 ** (n - 1), ri(rng, 1, len), ri(rng, 1, len)]);
        return { input: `${n}\n${k}`, expectedOutput: ref(n, k) };
      },
      solutions: {
        python: code`
          def findKthBit(n: int, k: int) -> str:
              flipped = False
              while n > 1:
                  mid = 1 << (n - 1)
                  if k == mid:
                      return "0" if flipped else "1"
                  if k > mid:
                      k = (1 << n) - k
                      flipped = not flipped
                  n -= 1
              return "1" if flipped else "0"
        `,
        javascript: code`
          var findKthBit = function(n, k) {
              var flipped = false;
              while (n > 1) {
                  var mid = 1 << (n - 1);
                  if (k === mid) return flipped ? "0" : "1";
                  if (k > mid) {
                      k = (1 << n) - k;
                      flipped = !flipped;
                  }
                  n--;
              }
              return flipped ? "1" : "0";
          };
        `,
        typescript: code`
          function findKthBit(n: number, k: number): string {
              var flipped = false;
              while (n > 1) {
                  var mid = 1 << (n - 1);
                  if (k === mid) return flipped ? "0" : "1";
                  if (k > mid) {
                      k = (1 << n) - k;
                      flipped = !flipped;
                  }
                  n--;
              }
              return flipped ? "1" : "0";
          }
        `,
        java: code`
          public static String findKthBit(int n, int k) {
              boolean flipped = false;
              while (n > 1) {
                  int mid = 1 << (n - 1);
                  if (k == mid) return flipped ? "0" : "1";
                  if (k > mid) {
                      k = (1 << n) - k;
                      flipped = !flipped;
                  }
                  n--;
              }
              return flipped ? "1" : "0";
          }
        `,
        cpp: code`
          string findKthBit(int n, int k) {
              bool flipped = false;
              while (n > 1) {
                  int mid = 1 << (n - 1);
                  if (k == mid) return flipped ? "0" : "1";
                  if (k > mid) {
                      k = (1 << n) - k;
                      flipped = !flipped;
                  }
                  n--;
              }
              return flipped ? "1" : "0";
          }
        `,
        c: code`
          char* findKthBit(int n, int k) {
              bool flipped = false;
              char* out = (char*)malloc(2);
              out[1] = '\0';
              while (n > 1) {
                  int mid = 1 << (n - 1);
                  if (k == mid) {
                      out[0] = flipped ? '0' : '1';
                      return out;
                  }
                  if (k > mid) {
                      k = (1 << n) - k;
                      flipped = !flipped;
                  }
                  n--;
              }
              out[0] = flipped ? '1' : '0';
              return out;
          }
        `,
        csharp: code`
          public static string FindKthBit(int n, int k)
          {
              bool flipped = false;
              while (n > 1)
              {
                  int mid = 1 << (n - 1);
                  if (k == mid) return flipped ? "0" : "1";
                  if (k > mid)
                  {
                      k = (1 << n) - k;
                      flipped = !flipped;
                  }
                  n--;
              }
              return flipped ? "1" : "0";
          }
        `,
        go: code`
          func findKthBit(n int, k int) string {
          	flipped := false
          	for n > 1 {
          		mid := 1 << uint(n-1)
          		if k == mid {
          			if flipped {
          				return "0"
          			}
          			return "1"
          		}
          		if k > mid {
          			k = (1 << uint(n)) - k
          			flipped = !flipped
          		}
          		n--
          	}
          	if flipped {
          		return "1"
          	}
          	return "0"
          }
        `,
        kotlin: code`
          fun findKthBit(n: Int, k: Int): String {
              var m = n
              var pos = k
              var flipped = false
              while (m > 1) {
                  val mid = 1 shl (m - 1)
                  if (pos == mid) return if (flipped) "0" else "1"
                  if (pos > mid) {
                      pos = (1 shl m) - pos
                      flipped = !flipped
                  }
                  m--
              }
              return if (flipped) "1" else "0"
          }
        `,
        swift: code`
          func findKthBit(_ n: Int, _ k: Int) -> String {
              var m = n, pos = k
              var flipped = false
              while m > 1 {
                  let mid = 1 << (m - 1)
                  if pos == mid { return flipped ? "0" : "1" }
                  if pos > mid {
                      pos = (1 << m) - pos
                      flipped = !flipped
                  }
                  m -= 1
              }
              return flipped ? "1" : "0"
          }
        `,
        rust: code`
          fn findKthBit(n: i32, k: i32) -> String {
              let mut m = n;
              let mut pos = k;
              let mut flipped = false;
              while m > 1 {
                  let mid = 1i32 << (m - 1);
                  if pos == mid {
                      return (if flipped { "0" } else { "1" }).to_string();
                  }
                  if pos > mid {
                      pos = (1i32 << m) - pos;
                      flipped = !flipped;
                  }
                  m -= 1;
              }
              (if flipped { "1" } else { "0" }).to_string()
          }
        `,
        php: code`
          function findKthBit($n, $k) {
              $flipped = false;
              while ($n > 1) {
                  $mid = 1 << ($n - 1);
                  if ($k == $mid) return $flipped ? "0" : "1";
                  if ($k > $mid) {
                      $k = (1 << $n) - $k;
                      $flipped = !$flipped;
                  }
                  $n--;
              }
              return $flipped ? "1" : "0";
          }
        `,
        ruby: code`
          def findKthBit(n, k)
            flipped = false
            while n > 1
              mid = 1 << (n - 1)
              return(flipped ? "0" : "1") if k == mid
              if k > mid
                k = (1 << n) - k
                flipped = !flipped
              end
              n -= 1
            end
            flipped ? "1" : "0"
          end
        `,
      },
    };
  })(),

  // ── Split a String Into the Max Number of Unique Substrings (LC 1593)
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      let best = 0;
      for (let mask = 0; mask < 1 << (n - 1); mask++) {
        const parts: string[] = [];
        let start = 0;
        for (let i = 0; i < n - 1; i++) if ((mask >> i) & 1) { parts.push(s.slice(start, i + 1)); start = i + 1; }
        parts.push(s.slice(start));
        if (new Set(parts).size === parts.length) best = Math.max(best, parts.length);
      }
      return best;
    };
    return {
      slug: "split-a-string-into-the-max-number-of-unique-substrings",
      title: "Split a String Into the Max Number of Unique Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Backtracking", "Google", "Amazon"],
      signature: { funcName: "maxUniqueSplit", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Split the string `s` into non-empty contiguous pieces whose concatenation is `s`, such that **no two pieces are equal**. Return the largest number of pieces such a split can have.",
        [
          { in: "s = \"codekairo\"", out: "8", note: "`o` appears twice, so not every letter can stand alone — for example `c, o, d, e, k, a, i, ro`." },
          { in: "s = \"aaaa\"", out: "2", note: "`a, aaa` works; three pieces would need three different lengths summing to 4, which is impossible." },
          { in: "s = \"abab\"", out: "3", note: "`a, b, ab`." },
        ],
        ["1 <= s.length <= 16", "s consists of lowercase English letters"]),
      hints: [
        "With at most 16 characters there are at most 2^15 ways to cut the string — a search is feasible.",
        "Backtrack: choose the next piece's end, skip it if that piece is already used, recurse, then un-use it.",
        "Prune: if the pieces so far plus the characters left (the most pieces still possible) cannot beat the best found, stop.",
      ],
      editorial: explain({
        idea: "Search over all cut positions with backtracking, keeping the pieces used so far in a hash set, and prune branches that cannot beat the best count.",
        steps: [
          "Recurse with `start` (first unused index) and `count` (pieces so far), sharing a set `seen` of used pieces.",
          "If `count + (n − start) <= best`, return — even one-character pieces for the rest would not improve the answer.",
          "If `start == n`, record `best = count`.",
          "Otherwise, for every `end` in `start+1 … n`: if `s[start..end)` is not in `seen`, add it, recurse with `(end, count + 1)`, and remove it.",
        ],
        why: "Every split is a choice of the first piece followed by a split of the rest, so the recursion enumerates all splits whose pieces are distinct, and the set check rejects exactly the splits with a repeated piece. The pruning bound is valid because the remaining `n − start` characters can form at most that many further pieces.",
        time: "O(2^n · n) in the worst case, far less with pruning",
        space: "O(n) besides the set of current pieces",
        pitfalls: [
          "Greedily taking the shortest unused piece is not optimal in general — search is required.",
          "Forgetting to remove a piece from the set when backtracking.",
          "The pieces must be distinct as strings; equal pieces at different positions are not allowed.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "8" },
        { input: '"aaaa"', expectedOutput: "2" },
        { input: '"abab"', expectedOutput: "3" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const len = pick(rng, [ri(rng, 1, 4), ri(rng, 5, 10), ri(rng, 8, 12), ri(rng, 8, 12)]);
        const s = randLower(rng, len, len, pick(rng, ["a", "ab", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def maxUniqueSplit(s: str) -> int:
              n = len(s)
              seen = set()
              best = [0]

              def dfs(start, count):
                  if count + (n - start) <= best[0]:
                      return
                  if start == n:
                      best[0] = count
                      return
                  for end in range(start + 1, n + 1):
                      piece = s[start:end]
                      if piece in seen:
                          continue
                      seen.add(piece)
                      dfs(end, count + 1)
                      seen.remove(piece)

              dfs(0, 0)
              return best[0]
        `,
        javascript: code`
          var maxUniqueSplit = function(s) {
              var n = s.length, best = 0;
              var seen = new Set();
              var dfs = function(start, count) {
                  if (count + (n - start) <= best) return;
                  if (start === n) {
                      best = count;
                      return;
                  }
                  for (var end = start + 1; end <= n; end++) {
                      var piece = s.substring(start, end);
                      if (seen.has(piece)) continue;
                      seen.add(piece);
                      dfs(end, count + 1);
                      seen.delete(piece);
                  }
              };
              dfs(0, 0);
              return best;
          };
        `,
        typescript: code`
          function maxUniqueSplit(s: string): number {
              var n = s.length, best = 0;
              var seen: { [k: string]: boolean } = {};
              var dfs = function(start: number, count: number): void {
                  if (count + (n - start) <= best) return;
                  if (start === n) {
                      best = count;
                      return;
                  }
                  for (var end = start + 1; end <= n; end++) {
                      var key = "#" + s.substring(start, end);
                      if (seen[key]) continue;
                      seen[key] = true;
                      dfs(end, count + 1);
                      seen[key] = false;
                  }
              };
              dfs(0, 0);
              return best;
          }
        `,
        java: code`
          public static int maxUniqueSplit(String s) {
              int[] best = new int[1];
              musDfs(s, 0, 0, new HashSet<String>(), best);
              return best[0];
          }

          static void musDfs(String s, int start, int count, Set<String> seen, int[] best) {
              int n = s.length();
              if (count + (n - start) <= best[0]) return;
              if (start == n) {
                  best[0] = count;
                  return;
              }
              for (int end = start + 1; end <= n; end++) {
                  String piece = s.substring(start, end);
                  if (!seen.add(piece)) continue;
                  musDfs(s, end, count + 1, seen, best);
                  seen.remove(piece);
              }
          }
        `,
        cpp: code`
          void musDfs(const string& s, int start, int count, unordered_set<string>& seen, int& best) {
              int n = (int)s.size();
              if (count + (n - start) <= best) return;
              if (start == n) {
                  best = count;
                  return;
              }
              for (int end = start + 1; end <= n; end++) {
                  string piece = s.substr(start, end - start);
                  if (seen.count(piece)) continue;
                  seen.insert(piece);
                  musDfs(s, end, count + 1, seen, best);
                  seen.erase(piece);
              }
          }

          int maxUniqueSplit(string s) {
              unordered_set<string> seen;
              int best = 0;
              musDfs(s, 0, 0, seen, best);
              return best;
          }
        `,
        c: code`
          static int musBest;
          static int musStarts[20], musLens[20];

          static void musDfs(const char* s, int n, int start, int count) {
              if (count + (n - start) <= musBest) return;
              if (start == n) {
                  musBest = count;
                  return;
              }
              for (int end = start + 1; end <= n; end++) {
                  int len = end - start, dup = 0;
                  for (int k = 0; k < count; k++) {
                      if (musLens[k] == len && strncmp(s + musStarts[k], s + start, len) == 0) {
                          dup = 1;
                          break;
                      }
                  }
                  if (dup) continue;
                  musStarts[count] = start;
                  musLens[count] = len;
                  musDfs(s, n, end, count + 1);
              }
          }

          int maxUniqueSplit(const char* s) {
              musBest = 0;
              musDfs(s, (int)strlen(s), 0, 0);
              return musBest;
          }
        `,
        csharp: code`
          public static int MaxUniqueSplit(string s)
          {
              int best = 0;
              MusDfs(s, 0, 0, new HashSet<string>(), ref best);
              return best;
          }

          static void MusDfs(string s, int start, int count, HashSet<string> seen, ref int best)
          {
              int n = s.Length;
              if (count + (n - start) <= best) return;
              if (start == n)
              {
                  best = count;
                  return;
              }
              for (int end = start + 1; end <= n; end++)
              {
                  string piece = s.Substring(start, end - start);
                  if (!seen.Add(piece)) continue;
                  MusDfs(s, end, count + 1, seen, ref best);
                  seen.Remove(piece);
              }
          }
        `,
        go: code`
          func maxUniqueSplit(s string) int {
          	n := len(s)
          	best := 0
          	seen := map[string]bool{}
          	var dfs func(start, count int)
          	dfs = func(start, count int) {
          		if count+(n-start) <= best {
          			return
          		}
          		if start == n {
          			best = count
          			return
          		}
          		for end := start + 1; end <= n; end++ {
          			piece := s[start:end]
          			if seen[piece] {
          				continue
          			}
          			seen[piece] = true
          			dfs(end, count+1)
          			delete(seen, piece)
          		}
          	}
          	dfs(0, 0)
          	return best
          }
        `,
        kotlin: code`
          fun maxUniqueSplit(s: String): Int {
              val n = s.length
              var best = 0
              val seen = HashSet<String>()
              fun dfs(start: Int, count: Int) {
                  if (count + (n - start) <= best) return
                  if (start == n) {
                      best = count
                      return
                  }
                  for (end in start + 1..n) {
                      val piece = s.substring(start, end)
                      if (!seen.add(piece)) continue
                      dfs(end, count + 1)
                      seen.remove(piece)
                  }
              }
              dfs(0, 0)
              return best
          }
        `,
        swift: code`
          func maxUniqueSplit(_ s: String) -> Int {
              let chars = Array(s)
              let n = chars.count
              var best = 0
              var seen = Set<String>()
              func dfs(_ start: Int, _ count: Int) {
                  if count + (n - start) <= best { return }
                  if start == n {
                      best = count
                      return
                  }
                  for end in (start + 1)...n {
                      let piece = String(chars[start..<end])
                      if seen.contains(piece) { continue }
                      seen.insert(piece)
                      dfs(end, count + 1)
                      seen.remove(piece)
                  }
              }
              dfs(0, 0)
              return best
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn maxUniqueSplit(s: String) -> i32 {
              let mut seen: HashSet<&str> = HashSet::new();
              let mut best = 0;
              mus_dfs(&s, 0, 0, &mut seen, &mut best);
              best
          }

          fn mus_dfs<'a>(s: &'a str, start: usize, count: i32, seen: &mut HashSet<&'a str>, best: &mut i32) {
              let n = s.len();
              if count + (n - start) as i32 <= *best {
                  return;
              }
              if start == n {
                  *best = count;
                  return;
              }
              for end in start + 1..=n {
                  let piece = &s[start..end];
                  if seen.contains(piece) {
                      continue;
                  }
                  seen.insert(piece);
                  mus_dfs(s, end, count + 1, seen, best);
                  seen.remove(piece);
              }
          }
        `,
        php: code`
          function maxUniqueSplit($s) {
              $best = 0;
              $seen = [];
              musDfs($s, strlen($s), 0, 0, $seen, $best);
              return $best;
          }

          function musDfs($s, $n, $start, $count, &$seen, &$best) {
              if ($count + ($n - $start) <= $best) return;
              if ($start == $n) {
                  $best = $count;
                  return;
              }
              for ($end = $start + 1; $end <= $n; $end++) {
                  $piece = "#" . substr($s, $start, $end - $start);
                  if (isset($seen[$piece])) continue;
                  $seen[$piece] = true;
                  musDfs($s, $n, $end, $count + 1, $seen, $best);
                  unset($seen[$piece]);
              }
          }
        `,
        ruby: code`
          require 'set'

          def maxUniqueSplit(s)
            @mus_best = 0
            mus_dfs(s, 0, 0, Set.new)
            @mus_best
          end

          def mus_dfs(s, start, count, seen)
            n = s.length
            return if count + (n - start) <= @mus_best
            if start == n
              @mus_best = count
              return
            end
            ((start + 1)..n).each do |e|
              piece = s[start...e]
              next if seen.include?(piece)
              seen.add(piece)
              mus_dfs(s, e, count + 1, seen)
              seen.delete(piece)
            end
          end
        `,
      },
    };
  })(),

  // ── Smallest String With A Given Numeric Value (LC 1663) ────────
  (() => {
    const ref = (n: number, k: number) => {
      let out = "";
      for (let i = 0; i < n; i++) {
        const rest = n - i - 1;
        let c = 1;
        while (k - c > 26 * rest) c++;
        out += String.fromCharCode(96 + c);
        k -= c;
      }
      return out;
    };
    return {
      slug: "smallest-string-with-a-given-numeric-value",
      title: "Smallest String With A Given Numeric Value",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Microsoft"],
      signature: { funcName: "getSmallestString", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "The **numeric value** of a lowercase letter is its position in the alphabet (`a` = 1, `b` = 2, …, `z` = 26), and the numeric value of a string is the sum of the values of its letters — for example `\"abe\"` has value 1 + 2 + 5 = 8.\n\nGiven integers `n` and `k`, return the lexicographically smallest string of length `n` whose numeric value is exactly `k`.",
        [
          { in: "n = 4, k = 30", out: "aabz", note: "1 + 1 + 2 + 26 = 30." },
          { in: "n = 2, k = 52", out: "zz" },
          { in: "n = 5, k = 5", out: "aaaaa" },
        ],
        ["1 <= n <= 10^5", "n <= k <= 26 * n"]),
      hints: [
        "To be lexicographically small, the string should start with as many `a`s as possible.",
        "So push the value to the end: fill from the right with the largest letters that still leave at least 1 for every earlier position.",
        "Start with all `a` (value `n`), then distribute the remaining `k − n` from the last position backwards, at most 25 extra per position.",
      ],
      editorial: explain({
        idea: "Start from `n` copies of `a` and add the remaining value `k − n` from the right end, each position taking up to 25 more (turning it into at most `z`).",
        steps: [
          "Create an array of `n` letters, all `a`, and set `extra = k − n`.",
          "For `i` from `n − 1` down to 0: add `d = min(25, extra)` to position `i` and subtract it from `extra`.",
          "Return the letters as a string.",
        ],
        why: "Among all strings of value `k`, the smallest one maximises its run of leading `a`s, and then keeps the first non-`a` letter as small as possible. Filling from the right puts as much value as possible into the later positions (each takes the maximum, 25 extra), so the earliest positions take only what is left, which is the least they can take. Since `k ≤ 26n`, the extra value always fits.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Filling from the left with `z`s produces the largest string, not the smallest.",
          "Each letter is worth at least 1, so subtract `n` before distributing.",
          "String concatenation in a loop can be quadratic in some languages — build a character array.",
        ],
      }),
      examples: [
        { input: "4\n30", expectedOutput: "aabz" },
        { input: "2\n52", expectedOutput: "zz" },
        { input: "5\n5", expectedOutput: "aaaaa" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 5), ri(rng, 1, 40), ri(rng, 1, 40)]);
        const k = pick(rng, [n, 26 * n, ri(rng, n, 26 * n), ri(rng, n, 26 * n), ri(rng, n, Math.min(26 * n, n + 30))]);
        return { input: `${n}\n${k}`, expectedOutput: ref(n, k) };
      },
      solutions: {
        python: code`
          def getSmallestString(n: int, k: int) -> str:
              res = ["a"] * n
              extra = k - n
              i = n - 1
              while extra > 0:
                  d = min(25, extra)
                  res[i] = chr(97 + d)
                  extra -= d
                  i -= 1
              return "".join(res)
        `,
        javascript: code`
          var getSmallestString = function(n, k) {
              var res = [];
              for (var i = 0; i < n; i++) res.push(0);
              var extra = k - n;
              for (var j = n - 1; j >= 0 && extra > 0; j--) {
                  var d = Math.min(25, extra);
                  res[j] = d;
                  extra -= d;
              }
              var out = [];
              for (var t = 0; t < n; t++) out.push(String.fromCharCode(97 + res[t]));
              return out.join("");
          };
        `,
        typescript: code`
          function getSmallestString(n: number, k: number): string {
              var res: number[] = [];
              for (var i = 0; i < n; i++) res.push(0);
              var extra = k - n;
              for (var j = n - 1; j >= 0 && extra > 0; j--) {
                  var d = Math.min(25, extra);
                  res[j] = d;
                  extra -= d;
              }
              var out: string[] = [];
              for (var t = 0; t < n; t++) out.push(String.fromCharCode(97 + res[t]));
              return out.join("");
          }
        `,
        java: code`
          public static String getSmallestString(int n, int k) {
              char[] res = new char[n];
              Arrays.fill(res, 'a');
              int extra = k - n;
              for (int i = n - 1; i >= 0 && extra > 0; i--) {
                  int d = Math.min(25, extra);
                  res[i] = (char)('a' + d);
                  extra -= d;
              }
              return new String(res);
          }
        `,
        cpp: code`
          string getSmallestString(int n, int k) {
              string res(n, 'a');
              int extra = k - n;
              for (int i = n - 1; i >= 0 && extra > 0; i--) {
                  int d = min(25, extra);
                  res[i] = (char)('a' + d);
                  extra -= d;
              }
              return res;
          }
        `,
        c: code`
          char* getSmallestString(int n, int k) {
              char* res = (char*)malloc(n + 1);
              for (int i = 0; i < n; i++) res[i] = 'a';
              res[n] = '\0';
              int extra = k - n;
              for (int i = n - 1; i >= 0 && extra > 0; i--) {
                  int d = extra < 25 ? extra : 25;
                  res[i] = (char)('a' + d);
                  extra -= d;
              }
              return res;
          }
        `,
        csharp: code`
          public static string GetSmallestString(int n, int k)
          {
              var res = new char[n];
              for (int i = 0; i < n; i++) res[i] = 'a';
              int extra = k - n;
              for (int i = n - 1; i >= 0 && extra > 0; i--)
              {
                  int d = Math.Min(25, extra);
                  res[i] = (char)('a' + d);
                  extra -= d;
              }
              return new string(res);
          }
        `,
        go: code`
          func getSmallestString(n int, k int) string {
          	res := make([]byte, n)
          	for i := range res {
          		res[i] = 'a'
          	}
          	extra := k - n
          	for i := n - 1; i >= 0 && extra > 0; i-- {
          		d := extra
          		if d > 25 {
          			d = 25
          		}
          		res[i] = byte('a' + d)
          		extra -= d
          	}
          	return string(res)
          }
        `,
        kotlin: code`
          fun getSmallestString(n: Int, k: Int): String {
              val res = CharArray(n) { 'a' }
              var extra = k - n
              var i = n - 1
              while (i >= 0 && extra > 0) {
                  val d = minOf(25, extra)
                  res[i] = 'a' + d
                  extra -= d
                  i--
              }
              return String(res)
          }
        `,
        swift: code`
          func getSmallestString(_ n: Int, _ k: Int) -> String {
              var res = [UInt8](repeating: 97, count: n)
              var extra = k - n
              var i = n - 1
              while i >= 0 && extra > 0 {
                  let d = min(25, extra)
                  res[i] = UInt8(97 + d)
                  extra -= d
                  i -= 1
              }
              return String(decoding: res, as: UTF8.self)
          }
        `,
        rust: code`
          fn getSmallestString(n: i32, k: i32) -> String {
              let n = n as usize;
              let mut res = vec![b'a'; n];
              let mut extra = k - n as i32;
              let mut i = n;
              while i > 0 && extra > 0 {
                  i -= 1;
                  let d = std::cmp::min(25, extra);
                  res[i] = b'a' + d as u8;
                  extra -= d;
              }
              String::from_utf8(res).unwrap()
          }
        `,
        php: code`
          function getSmallestString($n, $k) {
              $res = str_repeat("a", $n);
              $extra = $k - $n;
              for ($i = $n - 1; $i >= 0 && $extra > 0; $i--) {
                  $d = min(25, $extra);
                  $res[$i] = chr(97 + $d);
                  $extra -= $d;
              }
              return $res;
          }
        `,
        ruby: code`
          def getSmallestString(n, k)
            res = "a" * n
            extra = k - n
            i = n - 1
            while i >= 0 && extra > 0
              d = [25, extra].min
              res[i] = (97 + d).chr
              extra -= d
              i -= 1
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Maximum Binary String After Change (LC 1702) ────────────────
  (() => {
    const formula = (b: string) => {
      const zeros = b.split("").filter((c) => c === "0").length;
      if (zeros <= 1) return b;
      const p = b.indexOf("0");
      const pos = p + zeros - 1;
      return "1".repeat(pos) + "0" + "1".repeat(b.length - pos - 1);
    };
    // Exhaustive search over every reachable string for short inputs.
    const bfs = (b: string) => {
      const seen = new Set([b]);
      const queue = [b];
      let best = b;
      while (queue.length) {
        const t = queue.pop()!;
        if (t > best) best = t;
        for (let i = 0; i + 1 < t.length; i++) {
          const pair = t.slice(i, i + 2);
          const u = pair === "00" ? t.slice(0, i) + "10" + t.slice(i + 2) : pair === "10" ? t.slice(0, i) + "01" + t.slice(i + 2) : null;
          if (u !== null && !seen.has(u)) { seen.add(u); queue.push(u); }
        }
      }
      return best;
    };
    const ref = (b: string) => {
      const f = formula(b);
      if (b.length <= 9 && bfs(b) !== f) throw new Error(`maximum-binary-string mismatch on ${b}`);
      return f;
    };
    return {
      slug: "maximum-binary-string-after-change",
      title: "Maximum Binary String After Change",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Google"],
      signature: { funcName: "maximumBinaryString", params: [{ name: "binary", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a binary string `binary`. You may apply the following operations any number of times, in any order:\n\n- replace a substring `\"00\"` with `\"10\"`;\n- replace a substring `\"10\"` with `\"01\"`.\n\nReturn the largest binary string you can obtain, comparing strings as binary numbers (the length never changes, so this is the same as lexicographic order).",
        [
          { in: "binary = \"0101\"", out: "1011", note: "`0101 → 0011 → 1011` (`10→01`, then `00→10`)." },
          { in: "binary = \"1000\"", out: "1110" },
          { in: "binary = \"11\"", out: "11", note: "No operation applies." },
        ],
        ["1 <= binary.length <= 10^5", "binary[i] is '0' or '1'"]),
      hints: [
        "Ones before the first zero are already as good as they can be — leave them.",
        "The `10 → 01` move lets you slide a zero leftwards past ones, so all zeros can be gathered into one block right after that prefix.",
        "A block of `z` zeros becomes `z − 1` ones followed by one zero using `00 → 10`. So at most one zero survives.",
      ],
      editorial: explain({
        idea: "Every zero after the first one can be pulled left next to it, and a block of zeros collapses to ones with a single `0` at its end — so the answer has exactly one zero (if there were at least two), at position `firstZero + zeros − 1`.",
        steps: [
          "Count the zeros `z`. If `z <= 1`, return the string unchanged.",
          "Let `p` be the index of the first zero.",
          "Return a string of all `1`s except a `0` at index `p + z − 1`.",
        ],
        why: "Reachable: `10 → 01` slides each later zero left past ones until all `z` zeros sit at `p … p + z − 1`, and `00 → 10` applied from the left of that block turns it into `z − 1` ones and a final zero. Optimal: for a string with at least one zero let `f = (index of its first zero) + (number of zeros) − 1`. `10 → 01` keeps the zero count and never moves the first zero right, and `00 → 10` removes one zero while moving the first zero right by at most one, so `f` never increases and every reachable string has `f ≤ p + z − 1`. A reachable string's first zero is therefore at an index ≤ `p + z − 1`, with equality only if it has a single zero — so it is never larger than the string of ones with one zero at `p + z − 1`.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Strings with zero or one `0` cannot be improved at all.",
          "The surviving zero is not at the end of the string — ones after the zero block stay where they are.",
          "Simulating the operations is exponential; count instead.",
        ],
      }),
      examples: [
        { input: '"0101"', expectedOutput: "1011" },
        { input: '"1000"', expectedOutput: "1110" },
        { input: '"11"', expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const b = randLower(rng, 1, pick(rng, [4, 9, 9, 30]), pick(rng, ["01", "01", "001", "011", "0", "1"]));
        return { input: `"${b}"`, expectedOutput: ref(b) };
      },
      solutions: {
        python: code`
          def maximumBinaryString(binary: str) -> str:
              zeros = binary.count("0")
              if zeros <= 1:
                  return binary
              pos = binary.index("0") + zeros - 1
              n = len(binary)
              return "1" * pos + "0" + "1" * (n - pos - 1)
        `,
        javascript: code`
          var maximumBinaryString = function(binary) {
              var n = binary.length, zeros = 0, first = -1;
              for (var i = 0; i < n; i++) {
                  if (binary[i] === "0") {
                      zeros++;
                      if (first < 0) first = i;
                  }
              }
              if (zeros <= 1) return binary;
              var pos = first + zeros - 1;
              var out = [];
              for (var j = 0; j < n; j++) out.push(j === pos ? "0" : "1");
              return out.join("");
          };
        `,
        typescript: code`
          function maximumBinaryString(binary: string): string {
              var n = binary.length, zeros = 0, first = -1;
              for (var i = 0; i < n; i++) {
                  if (binary.charAt(i) === "0") {
                      zeros++;
                      if (first < 0) first = i;
                  }
              }
              if (zeros <= 1) return binary;
              var pos = first + zeros - 1;
              var out: string[] = [];
              for (var j = 0; j < n; j++) out.push(j === pos ? "0" : "1");
              return out.join("");
          }
        `,
        java: code`
          public static String maximumBinaryString(String binary) {
              int n = binary.length(), zeros = 0, first = -1;
              for (int i = 0; i < n; i++) {
                  if (binary.charAt(i) == '0') {
                      zeros++;
                      if (first < 0) first = i;
                  }
              }
              if (zeros <= 1) return binary;
              char[] res = new char[n];
              Arrays.fill(res, '1');
              res[first + zeros - 1] = '0';
              return new String(res);
          }
        `,
        cpp: code`
          string maximumBinaryString(string binary) {
              int n = (int)binary.size(), zeros = 0, first = -1;
              for (int i = 0; i < n; i++) {
                  if (binary[i] == '0') {
                      zeros++;
                      if (first < 0) first = i;
                  }
              }
              if (zeros <= 1) return binary;
              string res(n, '1');
              res[first + zeros - 1] = '0';
              return res;
          }
        `,
        c: code`
          char* maximumBinaryString(const char* binary) {
              int n = (int)strlen(binary), zeros = 0, first = -1;
              char* res = (char*)malloc(n + 1);
              for (int i = 0; i < n; i++) {
                  if (binary[i] == '0') {
                      zeros++;
                      if (first < 0) first = i;
                  }
              }
              if (zeros <= 1) {
                  memcpy(res, binary, n + 1);
                  return res;
              }
              for (int i = 0; i < n; i++) res[i] = '1';
              res[first + zeros - 1] = '0';
              res[n] = '\0';
              return res;
          }
        `,
        csharp: code`
          public static string MaximumBinaryString(string binary)
          {
              int n = binary.Length, zeros = 0, first = -1;
              for (int i = 0; i < n; i++)
              {
                  if (binary[i] == '0')
                  {
                      zeros++;
                      if (first < 0) first = i;
                  }
              }
              if (zeros <= 1) return binary;
              var res = new string('1', n).ToCharArray();
              res[first + zeros - 1] = '0';
              return new string(res);
          }
        `,
        go: code`
          func maximumBinaryString(binary string) string {
          	n := len(binary)
          	zeros, first := 0, -1
          	for i := 0; i < n; i++ {
          		if binary[i] == '0' {
          			zeros++
          			if first < 0 {
          				first = i
          			}
          		}
          	}
          	if zeros <= 1 {
          		return binary
          	}
          	res := []byte(strings.Repeat("1", n))
          	res[first+zeros-1] = '0'
          	return string(res)
          }
        `,
        kotlin: code`
          fun maximumBinaryString(binary: String): String {
              val zeros = binary.count { it == '0' }
              if (zeros <= 1) return binary
              val pos = binary.indexOf('0') + zeros - 1
              val res = CharArray(binary.length) { '1' }
              res[pos] = '0'
              return String(res)
          }
        `,
        swift: code`
          func maximumBinaryString(_ binary: String) -> String {
              let b = Array(binary.utf8)
              var zeros = 0, first = -1
              for i in 0..<b.count where b[i] == 48 {
                  zeros += 1
                  if first < 0 { first = i }
              }
              if zeros <= 1 { return binary }
              var res = [UInt8](repeating: 49, count: b.count)
              res[first + zeros - 1] = 48
              return String(decoding: res, as: UTF8.self)
          }
        `,
        rust: code`
          fn maximumBinaryString(binary: String) -> String {
              let b = binary.as_bytes();
              let zeros = b.iter().filter(|&&c| c == b'0').count();
              if zeros <= 1 {
                  return binary;
              }
              let first = b.iter().position(|&c| c == b'0').unwrap();
              let mut res = vec![b'1'; b.len()];
              res[first + zeros - 1] = b'0';
              String::from_utf8(res).unwrap()
          }
        `,
        php: code`
          function maximumBinaryString($binary) {
              $zeros = substr_count($binary, "0");
              if ($zeros <= 1) return $binary;
              $res = str_repeat("1", strlen($binary));
              $res[strpos($binary, "0") + $zeros - 1] = "0";
              return $res;
          }
        `,
        ruby: code`
          def maximumBinaryString(binary)
            zeros = binary.count("0")
            return binary if zeros <= 1
            res = "1" * binary.length
            res[binary.index("0") + zeros - 1] = "0"
            res
          end
        `,
      },
    };
  })(),

];
