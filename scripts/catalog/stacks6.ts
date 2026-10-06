/**
 * Stack and monotonic-structure problems — wave 6.
 * Real problems only: LeetCode numbered classics plus named GFG/InterviewBit
 * staples where noted (Stock Span, Nearest Smaller Element, Maximum of Minimum
 * for Every Window Size, The Celebrity Problem, Next Greater Frequency
 * Element, Infix to Postfix). Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri,
  type CatalogProblem, type Rng,
} from "./types.js";

export const STACKS6_PROBLEMS: CatalogProblem[] = [

  // ── Stock Span Problem (GFG) ───────────────────────────────────
  (() => {
    const ref = (prices: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < prices.length; i++) {
        let j = i;
        while (j > 0 && prices[j - 1] <= prices[i]) j--;
        out.push(i - j + 1);
      }
      return out;
    };
    return {
      slug: "stock-span-problem",
      title: "Stock Span Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Microsoft", "Flipkart", "Adobe"],
      signature: { funcName: "calculateSpan", params: [{ name: "prices", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "`prices[i]` is the closing price of a share on day `i`. The **span** of day `i` is the number of consecutive days, ending with day `i` itself and walking backwards, on which the price was **less than or equal to** the price of day `i`.\n\nSo the span is always at least 1 (the day itself), and it stops growing at the first earlier day whose price is strictly higher.\n\nReturn an array holding the span of every day.",
        [
          { in: "prices = [100,80,60,70,60,75,85]", out: "[1,1,1,2,1,4,6]", note: "Day 5 (price 75) reaches back over 60, 70 and 60 and stops at 80, so its span is 4." },
          { in: "prices = [10,4,5,90,120,80]", out: "[1,1,2,4,5,1]" },
          { in: "prices = [5,5,5]", out: "[1,2,3]", note: "Equal prices do not stop the span." },
        ],
        ["1 <= prices.length <= 10^5", "1 <= prices[i] <= 10^5"]),
      hints: [
        "Walking back from every day costs O(n²) on a rising market. What can you forget once a higher price appears?",
        "If day `j` has a price no higher than day `i` (and `j < i`), no later day can ever stop at `j` without also passing `i`.",
        "Keep a stack of indices with strictly decreasing prices. Pop every index whose price is at most today's; the span reaches back to the index left on top (or to the start).",
      ],
      editorial: explain({
        idea: "The span of day `i` ends at the nearest earlier day with a strictly higher price — the *previous greater element* — which a monotonic stack finds for all days in one pass.",
        steps: [
          "Keep a stack of day indices whose prices are strictly decreasing from bottom to top.",
          "For day `i`, pop every index whose price is less than or equal to `prices[i]`.",
          "If the stack is now empty, every earlier day was no higher, so the span is `i + 1`; otherwise it is `i - top`.",
          "Push `i` and continue.",
        ],
        why: "A popped day `j` has `prices[j] <= prices[i]` with `j < i`. Any later day that walks back far enough to reach `j` must first pass `i`, and it would stop at `i` already if `prices[i]` were higher than its own price — so `j` can never be the stopping point again. What remains on the stack is exactly the set of candidate stopping points, and the top one is the nearest.",
        time: "O(n) — every index is pushed and popped at most once",
        space: "O(n)",
        pitfalls: [
          "Pop on `<=`, not `<`: an equal price belongs to the span.",
          "Store indices, not prices, so the span is a subtraction.",
          "When the stack empties the span covers every day so far: `i + 1`, not `i`.",
        ],
      }),
      examples: [
        { input: "[100,80,60,70,60,75,85]", expectedOutput: "[1,1,1,2,1,4,6]" },
        { input: "[10,4,5,90,120,80]", expectedOutput: "[1,1,2,4,5,1]" },
        { input: "[5,5,5]", expectedOutput: "[1,2,3]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 10, 100000]);
        const prices = Array.from({ length: n }, () => ri(rng, 1, hi));
        const shape = ri(rng, 0, 5);
        if (shape === 0) prices.sort((a, b) => a - b);
        else if (shape === 1) prices.sort((a, b) => b - a);
        return { input: fmtIntArr(prices), expectedOutput: fmtIntArr(ref(prices)) };
      },
      solutions: {
        python: code`
          from typing import List

          def calculateSpan(prices: List[int]) -> List[int]:
              stack = []
              spans = []
              for i, p in enumerate(prices):
                  while stack and prices[stack[-1]] <= p:
                      stack.pop()
                  spans.append(i + 1 if not stack else i - stack[-1])
                  stack.append(i)
              return spans
        `,
        javascript: code`
          var calculateSpan = function(prices) {
              var stack = [];
              var spans = [];
              for (var i = 0; i < prices.length; i++) {
                  while (stack.length > 0 && prices[stack[stack.length - 1]] <= prices[i]) stack.pop();
                  spans.push(stack.length === 0 ? i + 1 : i - stack[stack.length - 1]);
                  stack.push(i);
              }
              return spans;
          };
        `,
        typescript: code`
          function calculateSpan(prices: number[]): number[] {
              var stack: number[] = [];
              var spans: number[] = [];
              for (var i = 0; i < prices.length; i++) {
                  while (stack.length > 0 && prices[stack[stack.length - 1]] <= prices[i]) stack.pop();
                  spans.push(stack.length === 0 ? i + 1 : i - stack[stack.length - 1]);
                  stack.push(i);
              }
              return spans;
          }
        `,
        java: code`
          public static int[] calculateSpan(int[] prices) {
              int n = prices.length;
              int[] spans = new int[n];
              int[] stack = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  while (top > 0 && prices[stack[top - 1]] <= prices[i]) top--;
                  spans[i] = top == 0 ? i + 1 : i - stack[top - 1];
                  stack[top++] = i;
              }
              return spans;
          }
        `,
        cpp: code`
          vector<int> calculateSpan(vector<int>& prices) {
              int n = prices.size();
              vector<int> spans(n);
              vector<int> st;
              for (int i = 0; i < n; i++) {
                  while (!st.empty() && prices[st.back()] <= prices[i]) st.pop_back();
                  spans[i] = st.empty() ? i + 1 : i - st.back();
                  st.push_back(i);
              }
              return spans;
          }
        `,
        c: code`
          int* calculateSpan(int* prices, int pricesSize, int* returnSize) {
              int cap = pricesSize > 0 ? pricesSize : 1;
              int* spans = (int*)malloc(sizeof(int) * cap);
              int* st = (int*)malloc(sizeof(int) * cap);
              int top = 0;
              for (int i = 0; i < pricesSize; i++) {
                  while (top > 0 && prices[st[top - 1]] <= prices[i]) top--;
                  spans[i] = top == 0 ? i + 1 : i - st[top - 1];
                  st[top++] = i;
              }
              free(st);
              *returnSize = pricesSize;
              return spans;
          }
        `,
        csharp: code`
          public static int[] CalculateSpan(int[] prices)
          {
              int n = prices.Length;
              int[] spans = new int[n];
              var st = new Stack<int>();
              for (int i = 0; i < n; i++)
              {
                  while (st.Count > 0 && prices[st.Peek()] <= prices[i]) st.Pop();
                  spans[i] = st.Count == 0 ? i + 1 : i - st.Peek();
                  st.Push(i);
              }
              return spans;
          }
        `,
        go: code`
          func calculateSpan(prices []int) []int {
              n := len(prices)
              spans := make([]int, n)
              st := []int{}
              for i := 0; i < n; i++ {
                  for len(st) > 0 && prices[st[len(st)-1]] <= prices[i] {
                      st = st[:len(st)-1]
                  }
                  if len(st) == 0 {
                      spans[i] = i + 1
                  } else {
                      spans[i] = i - st[len(st)-1]
                  }
                  st = append(st, i)
              }
              return spans
          }
        `,
        kotlin: code`
          fun calculateSpan(prices: IntArray): IntArray {
              val n = prices.size
              val spans = IntArray(n)
              val st = IntArray(n)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && prices[st[top - 1]] <= prices[i]) top--
                  spans[i] = if (top == 0) i + 1 else i - st[top - 1]
                  st[top++] = i
              }
              return spans
          }
        `,
        swift: code`
          func calculateSpan(_ prices: [Int]) -> [Int] {
              var spans = [Int](repeating: 0, count: prices.count)
              var st = [Int]()
              for i in 0..<prices.count {
                  while let last = st.last, prices[last] <= prices[i] {
                      st.removeLast()
                  }
                  spans[i] = st.isEmpty ? i + 1 : i - st[st.count - 1]
                  st.append(i)
              }
              return spans
          }
        `,
        rust: code`
          fn calculateSpan(prices: Vec<i32>) -> Vec<i32> {
              let n = prices.len();
              let mut spans = vec![0i32; n];
              let mut st: Vec<usize> = Vec::new();
              for i in 0..n {
                  while let Some(&last) = st.last() {
                      if prices[last] <= prices[i] {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  spans[i] = match st.last() {
                      Some(&j) => (i - j) as i32,
                      None => (i + 1) as i32,
                  };
                  st.push(i);
              }
              spans
          }
        `,
        php: code`
          function calculateSpan($prices) {
              $n = count($prices);
              $spans = array_fill(0, $n, 0);
              $st = [];
              for ($i = 0; $i < $n; $i++) {
                  while (!empty($st) && $prices[$st[count($st) - 1]] <= $prices[$i]) array_pop($st);
                  $spans[$i] = empty($st) ? $i + 1 : $i - $st[count($st) - 1];
                  $st[] = $i;
              }
              return $spans;
          }
        `,
        ruby: code`
          def calculateSpan(prices)
            st = []
            spans = []
            prices.each_with_index do |p, i|
              st.pop while !st.empty? && prices[st[-1]] <= p
              spans << (st.empty? ? i + 1 : i - st[-1])
              st << i
            end
            spans
          end
        `,
      },
    };
  })(),

  // ── Exclusive Time of Functions (LC 636) ───────────────────────
  (() => {
    const ref = (n: number, logs: string[]) => {
      // Pair every start with its end, then give each time unit to the
      // innermost call covering it (the covering call that started last).
      const calls: Array<[number, number, number]> = [];
      const open: Array<[number, number]> = [];
      for (const entry of logs) {
        const [id, kind, ts] = entry.split(":");
        if (kind === "start") open.push([Number(id), Number(ts)]);
        else { const [fid, s] = open.pop()!; calls.push([s, Number(ts), fid]); }
      }
      const res = new Array(n).fill(0);
      let lo = Infinity, hi = -Infinity;
      for (const [s, e] of calls) { lo = Math.min(lo, s); hi = Math.max(hi, e); }
      for (let u = lo; u <= hi; u++) {
        let best = -1, owner = -1;
        for (const [s, e, id] of calls) if (s <= u && u <= e && s > best) { best = s; owner = id; }
        if (owner >= 0) res[owner]++;
      }
      return res;
    };
    return {
      slug: "exclusive-time-of-functions",
      title: "Exclusive Time of Functions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Meta", "Amazon", "Uber", "LinkedIn"],
      signature: {
        funcName: "exclusiveTime",
        params: [{ name: "n", type: "int" as const }, { name: "logs", type: "string[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "A single-threaded CPU runs a program made of `n` functions with ids `0` to `n - 1`. Calls may nest (a function may call another, or itself), and the CPU always runs the most recently started call that has not finished yet.\n\nEvery call is recorded by two entries in `logs`, given in chronological order, each written `\"{id}:start:{t}\"` or `\"{id}:end:{t}\"`. A start at `t` means the call begins at the **beginning** of time unit `t`; an end at `t` means it finishes at the **end** of time unit `t`. So `\"0:start:3\"` followed by `\"0:end:4\"` is a call that ran for 2 units.\n\nThe **exclusive time** of a function is the total number of units the CPU spent running its own calls — time spent inside the calls it makes does not count. Return an array whose `i`-th value is the exclusive time of function `i`.",
        [
          { in: "n = 2, logs = [\"0:start:0\",\"1:start:3\",\"1:end:4\",\"0:end:7\"]", out: "[6,2]", note: "Function 0 runs units 0–2 and 5–7 (6 units); function 1 runs units 3–4." },
          { in: "n = 1, logs = [\"0:start:0\",\"0:start:2\",\"0:end:5\",\"0:end:6\"]", out: "[7]", note: "The recursive call covers units 2–5 and the outer call units 0–1 and 6; both count for function 0." },
          { in: "n = 3, logs = [\"0:start:0\",\"0:end:1\",\"2:start:2\",\"2:end:2\",\"1:start:4\",\"1:end:4\"]", out: "[2,1,1]", note: "The CPU is idle during unit 3." },
        ],
        [
          "1 <= n <= 100",
          "2 <= logs.length <= 500",
          "0 <= id < n",
          "0 <= t <= 10^9",
          "No two start entries share a timestamp, and no two end entries share a timestamp.",
          "Every start has a matching end, and the log is properly nested.",
        ]),
      hints: [
        "The function running at any moment is the one on top of the call stack.",
        "Keep a pointer `prev` to the first time unit not yet credited to anyone. Every log entry credits the stretch since `prev` to whoever was on top.",
        "On a start at `t`, the old top earns `t - prev` and `prev = t`. On an end at `t`, the finishing call earns `t - prev + 1` and `prev = t + 1`.",
      ],
      editorial: explain({
        idea: "Replay the log with a stack of active calls. Between two consecutive entries exactly one function — the top of the stack — owns the CPU, so each entry closes a stretch of time and credits it to that function.",
        steps: [
          "Create `res` of size `n`, an empty stack, and `prev = 0`, the first unit not yet credited.",
          "Parse each entry into `id`, kind and `t`.",
          "Start: if the stack is not empty, add `t - prev` to the top function; push `id`; set `prev = t`.",
          "End: pop the top (it is `id`), add `t - prev + 1` to it, and set `prev = t + 1` because unit `t` is fully used.",
          "Return `res`.",
        ],
        why: "The stack mirrors the real call stack, so its top is always the running function. Every time unit between the first start and the last end belongs to the segment between two consecutive entries, and each segment is credited exactly once — to the call that was running through it. Idle gaps between top-level calls happen while the stack is empty and are credited to nobody.",
        time: "O(L) for L log entries (each is parsed once)",
        space: "O(L) for the stack",
        pitfalls: [
          "Starts and ends use different boundaries: a start begins *at* `t`, an end finishes *after* `t` — hence the `+ 1` on ends and `prev = t + 1`.",
          "Recursion means the same id can be on the stack several times; credit the top entry, not a per-id timer.",
          "Parse the timestamp as a number — comparing strings would order `10` before `9`.",
        ],
      }),
      examples: [
        { input: "2\n[\"0:start:0\",\"1:start:3\",\"1:end:4\",\"0:end:7\"]", expectedOutput: "[6,2]" },
        { input: "1\n[\"0:start:0\",\"0:start:2\",\"0:end:5\",\"0:end:6\"]", expectedOutput: "[7]" },
        { input: "3\n[\"0:start:0\",\"0:end:1\",\"2:start:2\",\"2:end:2\",\"1:start:4\",\"1:end:4\"]", expectedOutput: "[2,1,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8]));
        const calls = ri(rng, 1, pick(rng, [1, 4, 12]));
        const base = rng() < 0.15 ? ri(rng, 0, 1000000000 - 400) : 0;
        const logs: string[] = [];
        const stack: number[] = [];
        let started = 0;
        let t = base;
        let lastStart = false;
        while (started < calls || stack.length > 0) {
          const doStart = started < calls && (stack.length === 0 || rng() < 0.5);
          const gap = ri(rng, 0, pick(rng, [0, 1, 3]));
          if (doStart) {
            const time = t + gap + (lastStart ? 1 : 0);
            const id = ri(rng, 0, n - 1);
            logs.push(`${id}:start:${time}`);
            stack.push(id);
            started++;
            t = time;
            lastStart = true;
          } else {
            const time = t + gap;
            logs.push(`${stack.pop()}:end:${time}`);
            t = time + 1;
            lastStart = false;
          }
        }
        return { input: `${n}\n${fmtStrArr(logs)}`, expectedOutput: fmtIntArr(ref(n, logs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def exclusiveTime(n: int, logs: List[str]) -> List[int]:
              res = [0] * n
              stack = []
              prev = 0
              for entry in logs:
                  fid, kind, ts = entry.split(':')
                  t = int(ts)
                  if kind == 'start':
                      if stack:
                          res[stack[-1]] += t - prev
                      stack.append(int(fid))
                      prev = t
                  else:
                      res[stack.pop()] += t - prev + 1
                      prev = t + 1
              return res
        `,
        javascript: code`
          var exclusiveTime = function(n, logs) {
              var res = new Array(n).fill(0);
              var stack = [];
              var prev = 0;
              for (var i = 0; i < logs.length; i++) {
                  var parts = logs[i].split(":");
                  var id = parseInt(parts[0], 10);
                  var t = parseInt(parts[2], 10);
                  if (parts[1] === "start") {
                      if (stack.length > 0) res[stack[stack.length - 1]] += t - prev;
                      stack.push(id);
                      prev = t;
                  } else {
                      res[stack.pop()] += t - prev + 1;
                      prev = t + 1;
                  }
              }
              return res;
          };
        `,
        typescript: code`
          function exclusiveTime(n: number, logs: string[]): number[] {
              var res: number[] = [];
              for (var k = 0; k < n; k++) res.push(0);
              var stack: number[] = [];
              var prev = 0;
              for (var i = 0; i < logs.length; i++) {
                  var parts = logs[i].split(":");
                  var id = parseInt(parts[0], 10);
                  var t = parseInt(parts[2], 10);
                  if (parts[1] === "start") {
                      if (stack.length > 0) res[stack[stack.length - 1]] += t - prev;
                      stack.push(id);
                      prev = t;
                  } else {
                      var top = stack.pop() as number;
                      res[top] += t - prev + 1;
                      prev = t + 1;
                  }
              }
              return res;
          }
        `,
        java: code`
          public static int[] exclusiveTime(int n, String[] logs) {
              int[] res = new int[n];
              int[] stack = new int[logs.length];
              int top = 0, prev = 0;
              for (String entry : logs) {
                  String[] parts = entry.split(":");
                  int id = Integer.parseInt(parts[0]);
                  int t = Integer.parseInt(parts[2]);
                  if (parts[1].equals("start")) {
                      if (top > 0) res[stack[top - 1]] += t - prev;
                      stack[top++] = id;
                      prev = t;
                  } else {
                      res[stack[--top]] += t - prev + 1;
                      prev = t + 1;
                  }
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> exclusiveTime(int n, vector<string>& logs) {
              vector<int> res(n, 0);
              vector<int> st;
              int prev = 0;
              for (const string& entry : logs) {
                  size_t a = entry.find(':');
                  size_t b = entry.find(':', a + 1);
                  int id = stoi(entry.substr(0, a));
                  string kind = entry.substr(a + 1, b - a - 1);
                  int t = stoi(entry.substr(b + 1));
                  if (kind == "start") {
                      if (!st.empty()) res[st.back()] += t - prev;
                      st.push_back(id);
                      prev = t;
                  } else {
                      res[st.back()] += t - prev + 1;
                      st.pop_back();
                      prev = t + 1;
                  }
              }
              return res;
          }
        `,
        c: code`
          int* exclusiveTime(int n, char** logs, int logsSize, int* returnSize) {
              int* res = (int*)calloc(n, sizeof(int));
              int* st = (int*)malloc(sizeof(int) * (logsSize + 1));
              int top = 0, prev = 0;
              for (int i = 0; i < logsSize; i++) {
                  const char* p = logs[i];
                  int id = 0;
                  while (*p != ':') { id = id * 10 + (*p - '0'); p++; }
                  p++;
                  int isStart = (*p == 's');
                  while (*p != ':') p++;
                  p++;
                  int t = 0;
                  while (*p >= '0' && *p <= '9') { t = t * 10 + (*p - '0'); p++; }
                  if (isStart) {
                      if (top > 0) res[st[top - 1]] += t - prev;
                      st[top++] = id;
                      prev = t;
                  } else {
                      res[st[--top]] += t - prev + 1;
                      prev = t + 1;
                  }
              }
              free(st);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          public static int[] ExclusiveTime(int n, string[] logs)
          {
              int[] res = new int[n];
              var st = new Stack<int>();
              int prev = 0;
              foreach (var entry in logs)
              {
                  var parts = entry.Split(':');
                  int id = int.Parse(parts[0]);
                  int t = int.Parse(parts[2]);
                  if (parts[1] == "start")
                  {
                      if (st.Count > 0) res[st.Peek()] += t - prev;
                      st.Push(id);
                      prev = t;
                  }
                  else
                  {
                      res[st.Pop()] += t - prev + 1;
                      prev = t + 1;
                  }
              }
              return res;
          }
        `,
        go: code`
          func exclusiveTime(n int, logs []string) []int {
              res := make([]int, n)
              st := []int{}
              prev := 0
              for _, entry := range logs {
                  parts := strings.Split(entry, ":")
                  id, _ := strconv.Atoi(parts[0])
                  t, _ := strconv.Atoi(parts[2])
                  if parts[1] == "start" {
                      if len(st) > 0 {
                          res[st[len(st)-1]] += t - prev
                      }
                      st = append(st, id)
                      prev = t
                  } else {
                      res[st[len(st)-1]] += t - prev + 1
                      st = st[:len(st)-1]
                      prev = t + 1
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun exclusiveTime(n: Int, logs: Array<String>): IntArray {
              val res = IntArray(n)
              val st = java.util.ArrayDeque<Int>()
              var prev = 0
              for (entry in logs) {
                  val parts = entry.split(":")
                  val id = parts[0].toInt()
                  val t = parts[2].toInt()
                  if (parts[1] == "start") {
                      if (st.isNotEmpty()) res[st.peek()] += t - prev
                      st.push(id)
                      prev = t
                  } else {
                      res[st.pop()] += t - prev + 1
                      prev = t + 1
                  }
              }
              return res
          }
        `,
        swift: code`
          func exclusiveTime(_ n: Int, _ logs: [String]) -> [Int] {
              var res = [Int](repeating: 0, count: n)
              var st = [Int]()
              var prev = 0
              for entry in logs {
                  let parts = entry.split(separator: ":").map { String($0) }
                  let id = Int(parts[0])!
                  let t = Int(parts[2])!
                  if parts[1] == "start" {
                      if let top = st.last { res[top] += t - prev }
                      st.append(id)
                      prev = t
                  } else {
                      let top = st.removeLast()
                      res[top] += t - prev + 1
                      prev = t + 1
                  }
              }
              return res
          }
        `,
        rust: code`
          fn exclusiveTime(n: i32, logs: Vec<String>) -> Vec<i32> {
              let mut res = vec![0i32; n as usize];
              let mut st: Vec<usize> = Vec::new();
              let mut prev: i32 = 0;
              for entry in logs.iter() {
                  let parts: Vec<&str> = entry.split(':').collect();
                  let id: usize = parts[0].parse().unwrap();
                  let t: i32 = parts[2].parse().unwrap();
                  if parts[1] == "start" {
                      if let Some(&top) = st.last() {
                          res[top] += t - prev;
                      }
                      st.push(id);
                      prev = t;
                  } else {
                      let top = st.pop().unwrap();
                      res[top] += t - prev + 1;
                      prev = t + 1;
                  }
              }
              res
          }
        `,
        php: code`
          function exclusiveTime($n, $logs) {
              $res = array_fill(0, $n, 0);
              $st = [];
              $prev = 0;
              foreach ($logs as $entry) {
                  $parts = explode(':', $entry);
                  $id = (int)$parts[0];
                  $t = (int)$parts[2];
                  if ($parts[1] === 'start') {
                      if (!empty($st)) $res[$st[count($st) - 1]] += $t - $prev;
                      $st[] = $id;
                      $prev = $t;
                  } else {
                      $top = array_pop($st);
                      $res[$top] += $t - $prev + 1;
                      $prev = $t + 1;
                  }
              }
              return $res;
          }
        `,
        ruby: code`
          def exclusiveTime(n, logs)
            res = Array.new(n, 0)
            st = []
            prev = 0
            logs.each do |entry|
              fid, kind, ts = entry.split(':')
              t = ts.to_i
              if kind == 'start'
                res[st[-1]] += t - prev unless st.empty?
                st << fid.to_i
                prev = t
              else
                res[st.pop] += t - prev + 1
                prev = t + 1
              end
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Steps to Make Array Non-decreasing (LC 2289) ───────────────
  (() => {
    const ref = (nums: number[]) => {
      let a = nums.slice();
      let steps = 0;
      for (;;) {
        const b = [a[0]];
        for (let i = 1; i < a.length; i++) if (a[i - 1] <= a[i]) b.push(a[i]);
        if (b.length === a.length) return steps;
        a = b;
        steps++;
      }
    };
    return {
      slug: "steps-to-make-array-non-decreasing",
      title: "Steps to Make Array Non-decreasing",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "totalSteps", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. In one **step**, every element `nums[i]` with `nums[i - 1] > nums[i]` is removed — all such elements at once, each judged against its left neighbour in the array as it was at the start of the step.\n\nSteps repeat until the array is non-decreasing. Return how many steps are performed.",
        [
          { in: "nums = [10,1,2,3,4,5]", out: "5", note: "Each step removes only the element right after 10: first 1, then 2, then 3, 4 and 5." },
          { in: "nums = [6,2,5,1,7,3]", out: "2", note: "Step 1 removes 2, 1 and 3, leaving [6,5,7]; step 2 removes 5, leaving [6,7]." },
          { in: "nums = [3,3,4,9]", out: "0" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9"]),
      hints: [
        "An element is eventually removed exactly when some earlier element is larger than it — but *when* is the question.",
        "An element is eaten by the nearest earlier larger element, after everything between them that is smaller has been eaten first.",
        "Scan left to right with a stack of (value, step it dies at). For a new value `x`, pop entries with value `<= x` keeping the largest death step `t` among them; if the stack still has something, `x` dies at `t + 1`, otherwise it never dies.",
      ],
      editorial: explain({
        idea: "Each element that ever disappears is removed by its nearest earlier *strictly larger* element, and only after every element between them has been removed. So its removal step is one more than the latest removal step among the elements in between — a quantity a monotonic stack maintains.",
        steps: [
          "Keep a stack of pairs `(value, step)` with values strictly decreasing from bottom to top; `step` is when that element is removed (0 means never).",
          "For each `x` in `nums`, set `t = 0` and pop every pair whose value is `<= x`, taking `t = max(t, step)`.",
          "If the stack is now empty, nothing before `x` is larger, so `x` survives: its step is 0. Otherwise its step is `t + 1`.",
          "Push `(x, step)` and track the maximum step seen — that is the answer.",
        ],
        why: "Let `j` be the nearest earlier element larger than `x`. Everything strictly between `j` and `x` is `<= x`, so none of it can eat `x`; `x` becomes adjacent to a larger element only once all of them are gone, which takes `t` steps, and it is eaten in the step after. The popped elements are exactly those between `j` and `x` that were still on the stack, and the ones popped earlier were removed no later than the ones that popped them, so the maximum is preserved. The process ends when the last removal happens, which is the largest step of all.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Simulating step by step is O(n²) on inputs like `[10,1,2,3,…]`.",
          "Pop on `<=`: an equal element never eats `x`, and it shields nothing from it either.",
          "An element with no larger predecessor gets step 0 even if it popped entries with large steps.",
        ],
      }),
      examples: [
        { input: "[10,1,2,3,4,5]", expectedOutput: "5" },
        { input: "[6,2,5,1,7,3]", expectedOutput: "2" },
        { input: "[3,3,4,9]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 12, 1000000000]);
        let nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const shape = ri(rng, 0, 7);
        if (shape === 0) nums.sort((a, b) => a - b);
        else if (shape === 1) nums.sort((a, b) => b - a);
        else if (shape === 2) {
          // a tall wall followed by a rising tail — the slow case
          const tail = nums.slice(1).sort((a, b) => a - b);
          nums = [hi].concat(tail);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def totalSteps(nums: List[int]) -> int:
              stack = []  # (value, step at which it is removed)
              best = 0
              for x in nums:
                  t = 0
                  while stack and stack[-1][0] <= x:
                      t = max(t, stack.pop()[1])
                  t = t + 1 if stack else 0
                  best = max(best, t)
                  stack.append((x, t))
              return best
        `,
        javascript: code`
          var totalSteps = function(nums) {
              var vals = [], steps = [];
              var best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], t = 0;
                  while (vals.length > 0 && vals[vals.length - 1] <= x) {
                      vals.pop();
                      t = Math.max(t, steps.pop());
                  }
                  t = vals.length > 0 ? t + 1 : 0;
                  if (t > best) best = t;
                  vals.push(x);
                  steps.push(t);
              }
              return best;
          };
        `,
        typescript: code`
          function totalSteps(nums: number[]): number {
              var vals: number[] = [], steps: number[] = [];
              var best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], t = 0;
                  while (vals.length > 0 && vals[vals.length - 1] <= x) {
                      vals.pop();
                      t = Math.max(t, steps.pop() as number);
                  }
                  t = vals.length > 0 ? t + 1 : 0;
                  if (t > best) best = t;
                  vals.push(x);
                  steps.push(t);
              }
              return best;
          }
        `,
        java: code`
          public static int totalSteps(int[] nums) {
              int n = nums.length;
              int[] vals = new int[n], steps = new int[n];
              int top = 0, best = 0;
              for (int x : nums) {
                  int t = 0;
                  while (top > 0 && vals[top - 1] <= x) {
                      top--;
                      t = Math.max(t, steps[top]);
                  }
                  t = top > 0 ? t + 1 : 0;
                  best = Math.max(best, t);
                  vals[top] = x;
                  steps[top] = t;
                  top++;
              }
              return best;
          }
        `,
        cpp: code`
          int totalSteps(vector<int>& nums) {
              vector<pair<int, int>> st;
              int best = 0;
              for (int x : nums) {
                  int t = 0;
                  while (!st.empty() && st.back().first <= x) {
                      t = max(t, st.back().second);
                      st.pop_back();
                  }
                  t = st.empty() ? 0 : t + 1;
                  best = max(best, t);
                  st.push_back(make_pair(x, t));
              }
              return best;
          }
        `,
        c: code`
          int totalSteps(int* nums, int numsSize) {
              int* vals = (int*)malloc(sizeof(int) * (numsSize + 1));
              int* steps = (int*)malloc(sizeof(int) * (numsSize + 1));
              int top = 0, best = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i], t = 0;
                  while (top > 0 && vals[top - 1] <= x) {
                      top--;
                      if (steps[top] > t) t = steps[top];
                  }
                  t = top > 0 ? t + 1 : 0;
                  if (t > best) best = t;
                  vals[top] = x;
                  steps[top] = t;
                  top++;
              }
              free(vals);
              free(steps);
              return best;
          }
        `,
        csharp: code`
          public static int TotalSteps(int[] nums)
          {
              int n = nums.Length;
              int[] vals = new int[n], steps = new int[n];
              int top = 0, best = 0;
              foreach (int x in nums)
              {
                  int t = 0;
                  while (top > 0 && vals[top - 1] <= x)
                  {
                      top--;
                      t = Math.Max(t, steps[top]);
                  }
                  t = top > 0 ? t + 1 : 0;
                  best = Math.Max(best, t);
                  vals[top] = x;
                  steps[top] = t;
                  top++;
              }
              return best;
          }
        `,
        go: code`
          func totalSteps(nums []int) int {
              vals := []int{}
              steps := []int{}
              best := 0
              for _, x := range nums {
                  t := 0
                  for len(vals) > 0 && vals[len(vals)-1] <= x {
                      if steps[len(steps)-1] > t {
                          t = steps[len(steps)-1]
                      }
                      vals = vals[:len(vals)-1]
                      steps = steps[:len(steps)-1]
                  }
                  if len(vals) > 0 {
                      t++
                  } else {
                      t = 0
                  }
                  if t > best {
                      best = t
                  }
                  vals = append(vals, x)
                  steps = append(steps, t)
              }
              return best
          }
        `,
        kotlin: code`
          fun totalSteps(nums: IntArray): Int {
              val n = nums.size
              val vals = IntArray(n)
              val steps = IntArray(n)
              var top = 0
              var best = 0
              for (x in nums) {
                  var t = 0
                  while (top > 0 && vals[top - 1] <= x) {
                      top--
                      t = maxOf(t, steps[top])
                  }
                  t = if (top > 0) t + 1 else 0
                  best = maxOf(best, t)
                  vals[top] = x
                  steps[top] = t
                  top++
              }
              return best
          }
        `,
        swift: code`
          func totalSteps(_ nums: [Int]) -> Int {
              var vals = [Int]()
              var steps = [Int]()
              var best = 0
              for x in nums {
                  var t = 0
                  while let last = vals.last, last <= x {
                      vals.removeLast()
                      t = max(t, steps.removeLast())
                  }
                  t = vals.isEmpty ? 0 : t + 1
                  best = max(best, t)
                  vals.append(x)
                  steps.append(t)
              }
              return best
          }
        `,
        rust: code`
          fn totalSteps(nums: Vec<i32>) -> i32 {
              let mut st: Vec<(i32, i32)> = Vec::new();
              let mut best = 0;
              for &x in nums.iter() {
                  let mut t = 0;
                  while let Some(&(v, s)) = st.last() {
                      if v <= x {
                          if s > t {
                              t = s;
                          }
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  t = if st.is_empty() { 0 } else { t + 1 };
                  if t > best {
                      best = t;
                  }
                  st.push((x, t));
              }
              best
          }
        `,
        php: code`
          function totalSteps($nums) {
              $vals = [];
              $steps = [];
              $best = 0;
              foreach ($nums as $x) {
                  $t = 0;
                  while (!empty($vals) && $vals[count($vals) - 1] <= $x) {
                      array_pop($vals);
                      $s = array_pop($steps);
                      if ($s > $t) $t = $s;
                  }
                  $t = empty($vals) ? 0 : $t + 1;
                  if ($t > $best) $best = $t;
                  $vals[] = $x;
                  $steps[] = $t;
              }
              return $best;
          }
        `,
        ruby: code`
          def totalSteps(nums)
            st = []
            best = 0
            nums.each do |x|
              t = 0
              while !st.empty? && st[-1][0] <= x
                t = [t, st.pop[1]].max
              end
              t = st.empty? ? 0 : t + 1
              best = t if t > best
              st << [x, t]
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Next Greater Element IV (LC 2454) ──────────────────────────
  (() => {
    const ref = (nums: number[]) => nums.map((x, i) => {
      let seen = 0;
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[j] > x) { seen++; if (seen === 2) return nums[j]; }
      }
      return -1;
    });
    return {
      slug: "next-greater-element-iv",
      title: "Next Greater Element IV",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Sorting", "Google", "Amazon", "Bloomberg"],
      signature: { funcName: "secondGreaterElement", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "For every index `i` of `nums`, find its **second greater** element: scanning to the right of `i`, ignore elements that are not strictly greater than `nums[i]`; the second strictly greater element you meet is the answer.\n\nFormally it is `nums[j]` for the smallest `j > i` with `nums[j] > nums[i]` such that exactly one index `k` with `i < k < j` also has `nums[k] > nums[i]`. If no such `j` exists the answer is `-1`.\n\nReturn the array of answers.",
        [
          { in: "nums = [1,5,2,4,3]", out: "[2,-1,3,-1,-1]", note: "For 1 the greater elements to its right are 5, 2, 4, 3 — the second is 2. For 2 they are 4 and 3, so the answer is 3." },
          { in: "nums = [6,1,8,3,9]", out: "[9,3,-1,-1,-1]" },
          { in: "nums = [4,4,4]", out: "[-1,-1,-1]", note: "Equal values are not greater." },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^9"]),
      hints: [
        "The classic next-greater stack answers 'first greater'. What happens to an index at the moment its first greater element arrives?",
        "Once an index has seen one greater element, it is waiting for a *second* one — keep those indices in a second stack.",
        "For each new value: first settle indices of the second stack smaller than it, then move indices of the first stack smaller than it onto the second stack (keeping their order), then push the new index onto the first stack.",
      ],
      editorial: explain({
        idea: "Track every index in one of two monotonic stacks: `first` holds indices that have not met any greater element yet, `second` holds indices that have met exactly one. A new value finishes some indices of `second` and promotes some of `first`.",
        steps: [
          "Fill `ans` with `-1`; keep two stacks of indices, `first` and `second`, each with non-increasing values from bottom to top.",
          "For index `i` with value `x`, pop from `second` while its top value is `< x` and set their answer to `x` — this is their second greater element.",
          "Pop from `first` while its top value is `< x` into a temporary list — `x` is their first greater element.",
          "Push the temporary list onto `second` in reverse order of popping (largest value first), so `second` stays monotonic.",
          "Push `i` onto `first`.",
        ],
        why: "An index moves `first → second → done` exactly when it meets its first and second strictly greater elements, because each stack is sorted: everything smaller than `x` sits at the top, so the pops touch exactly the indices that `x` exceeds. Settling `second` *before* promoting from `first` matters — an index promoted by `x` must not be finished by the same `x`. The promoted values are all `< x <=` everything left in `second`, so pushing them largest first keeps `second` monotonic.",
        time: "O(n) — each index is pushed and popped at most twice",
        space: "O(n)",
        pitfalls: [
          "Process the second stack first; otherwise an index would count the same element as both its first and second greater.",
          "Keep the moved indices in order — appending them reversed breaks the monotonic invariant of `second`.",
          "Strictly greater: equal values never count.",
        ],
      }),
      examples: [
        { input: "[1,5,2,4,3]", expectedOutput: "[2,-1,3,-1,-1]" },
        { input: "[6,1,8,3,9]", expectedOutput: "[9,3,-1,-1,-1]" },
        { input: "[4,4,4]", expectedOutput: "[-1,-1,-1]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 15, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const shape = ri(rng, 0, 6);
        if (shape === 0) nums.sort((a, b) => a - b);
        else if (shape === 1) nums.sort((a, b) => b - a);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def secondGreaterElement(nums: List[int]) -> List[int]:
              ans = [-1] * len(nums)
              first = []
              second = []
              for i, x in enumerate(nums):
                  while second and nums[second[-1]] < x:
                      ans[second.pop()] = x
                  moved = []
                  while first and nums[first[-1]] < x:
                      moved.append(first.pop())
                  second.extend(reversed(moved))
                  first.append(i)
              return ans
        `,
        javascript: code`
          var secondGreaterElement = function(nums) {
              var n = nums.length;
              var ans = new Array(n).fill(-1);
              var first = [], second = [];
              for (var i = 0; i < n; i++) {
                  var x = nums[i];
                  while (second.length > 0 && nums[second[second.length - 1]] < x) ans[second.pop()] = x;
                  var moved = [];
                  while (first.length > 0 && nums[first[first.length - 1]] < x) moved.push(first.pop());
                  for (var k = moved.length - 1; k >= 0; k--) second.push(moved[k]);
                  first.push(i);
              }
              return ans;
          };
        `,
        typescript: code`
          function secondGreaterElement(nums: number[]): number[] {
              var n = nums.length;
              var ans: number[] = [];
              for (var j = 0; j < n; j++) ans.push(-1);
              var first: number[] = [], second: number[] = [];
              for (var i = 0; i < n; i++) {
                  var x = nums[i];
                  while (second.length > 0 && nums[second[second.length - 1]] < x) ans[second.pop() as number] = x;
                  var moved: number[] = [];
                  while (first.length > 0 && nums[first[first.length - 1]] < x) moved.push(first.pop() as number);
                  for (var k = moved.length - 1; k >= 0; k--) second.push(moved[k]);
                  first.push(i);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] secondGreaterElement(int[] nums) {
              int n = nums.length;
              int[] ans = new int[n];
              Arrays.fill(ans, -1);
              int[] first = new int[n], second = new int[n], moved = new int[n];
              int f = 0, s = 0;
              for (int i = 0; i < n; i++) {
                  int x = nums[i];
                  while (s > 0 && nums[second[s - 1]] < x) ans[second[--s]] = x;
                  int m = 0;
                  while (f > 0 && nums[first[f - 1]] < x) moved[m++] = first[--f];
                  for (int k = m - 1; k >= 0; k--) second[s++] = moved[k];
                  first[f++] = i;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> secondGreaterElement(vector<int>& nums) {
              int n = nums.size();
              vector<int> ans(n, -1), first, second, moved;
              for (int i = 0; i < n; i++) {
                  int x = nums[i];
                  while (!second.empty() && nums[second.back()] < x) {
                      ans[second.back()] = x;
                      second.pop_back();
                  }
                  moved.clear();
                  while (!first.empty() && nums[first.back()] < x) {
                      moved.push_back(first.back());
                      first.pop_back();
                  }
                  for (int k = (int)moved.size() - 1; k >= 0; k--) second.push_back(moved[k]);
                  first.push_back(i);
              }
              return ans;
          }
        `,
        c: code`
          int* secondGreaterElement(int* nums, int numsSize, int* returnSize) {
              int cap = numsSize > 0 ? numsSize : 1;
              int* ans = (int*)malloc(sizeof(int) * cap);
              int* first = (int*)malloc(sizeof(int) * cap);
              int* second = (int*)malloc(sizeof(int) * cap);
              int* moved = (int*)malloc(sizeof(int) * cap);
              int f = 0, s = 0;
              for (int i = 0; i < numsSize; i++) ans[i] = -1;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  while (s > 0 && nums[second[s - 1]] < x) ans[second[--s]] = x;
                  int m = 0;
                  while (f > 0 && nums[first[f - 1]] < x) moved[m++] = first[--f];
                  for (int k = m - 1; k >= 0; k--) second[s++] = moved[k];
                  first[f++] = i;
              }
              free(first);
              free(second);
              free(moved);
              *returnSize = numsSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[] SecondGreaterElement(int[] nums)
          {
              int n = nums.Length;
              int[] ans = new int[n];
              for (int j = 0; j < n; j++) ans[j] = -1;
              int[] first = new int[n], second = new int[n], moved = new int[n];
              int f = 0, s = 0;
              for (int i = 0; i < n; i++)
              {
                  int x = nums[i];
                  while (s > 0 && nums[second[s - 1]] < x) ans[second[--s]] = x;
                  int m = 0;
                  while (f > 0 && nums[first[f - 1]] < x) moved[m++] = first[--f];
                  for (int k = m - 1; k >= 0; k--) second[s++] = moved[k];
                  first[f++] = i;
              }
              return ans;
          }
        `,
        go: code`
          func secondGreaterElement(nums []int) []int {
              n := len(nums)
              ans := make([]int, n)
              for i := range ans {
                  ans[i] = -1
              }
              first := []int{}
              second := []int{}
              for i, x := range nums {
                  for len(second) > 0 && nums[second[len(second)-1]] < x {
                      ans[second[len(second)-1]] = x
                      second = second[:len(second)-1]
                  }
                  moved := []int{}
                  for len(first) > 0 && nums[first[len(first)-1]] < x {
                      moved = append(moved, first[len(first)-1])
                      first = first[:len(first)-1]
                  }
                  for k := len(moved) - 1; k >= 0; k-- {
                      second = append(second, moved[k])
                  }
                  first = append(first, i)
              }
              return ans
          }
        `,
        kotlin: code`
          fun secondGreaterElement(nums: IntArray): IntArray {
              val n = nums.size
              val ans = IntArray(n) { -1 }
              val first = IntArray(n)
              val second = IntArray(n)
              val moved = IntArray(n)
              var f = 0
              var s = 0
              for (i in 0 until n) {
                  val x = nums[i]
                  while (s > 0 && nums[second[s - 1]] < x) {
                      s--
                      ans[second[s]] = x
                  }
                  var m = 0
                  while (f > 0 && nums[first[f - 1]] < x) {
                      f--
                      moved[m++] = first[f]
                  }
                  for (k in m - 1 downTo 0) second[s++] = moved[k]
                  first[f++] = i
              }
              return ans
          }
        `,
        swift: code`
          func secondGreaterElement(_ nums: [Int]) -> [Int] {
              var ans = [Int](repeating: -1, count: nums.count)
              var first = [Int]()
              var second = [Int]()
              for i in 0..<nums.count {
                  let x = nums[i]
                  while let top = second.last, nums[top] < x {
                      ans[top] = x
                      second.removeLast()
                  }
                  var moved = [Int]()
                  while let top = first.last, nums[top] < x {
                      moved.append(top)
                      first.removeLast()
                  }
                  second.append(contentsOf: moved.reversed())
                  first.append(i)
              }
              return ans
          }
        `,
        rust: code`
          fn secondGreaterElement(nums: Vec<i32>) -> Vec<i32> {
              let n = nums.len();
              let mut ans = vec![-1i32; n];
              let mut first: Vec<usize> = Vec::new();
              let mut second: Vec<usize> = Vec::new();
              for i in 0..n {
                  let x = nums[i];
                  while let Some(&top) = second.last() {
                      if nums[top] < x {
                          ans[top] = x;
                          second.pop();
                      } else {
                          break;
                      }
                  }
                  let mut moved: Vec<usize> = Vec::new();
                  while let Some(&top) = first.last() {
                      if nums[top] < x {
                          moved.push(top);
                          first.pop();
                      } else {
                          break;
                      }
                  }
                  for k in (0..moved.len()).rev() {
                      second.push(moved[k]);
                  }
                  first.push(i);
              }
              ans
          }
        `,
        php: code`
          function secondGreaterElement($nums) {
              $n = count($nums);
              $ans = array_fill(0, $n, -1);
              $first = [];
              $second = [];
              for ($i = 0; $i < $n; $i++) {
                  $x = $nums[$i];
                  while (!empty($second) && $nums[$second[count($second) - 1]] < $x) {
                      $ans[array_pop($second)] = $x;
                  }
                  $moved = [];
                  while (!empty($first) && $nums[$first[count($first) - 1]] < $x) {
                      $moved[] = array_pop($first);
                  }
                  for ($k = count($moved) - 1; $k >= 0; $k--) $second[] = $moved[$k];
                  $first[] = $i;
              }
              return $ans;
          }
        `,
        ruby: code`
          def secondGreaterElement(nums)
            ans = Array.new(nums.length, -1)
            first = []
            second = []
            nums.each_with_index do |x, i|
              ans[second.pop] = x while !second.empty? && nums[second[-1]] < x
              moved = []
              moved << first.pop while !first.empty? && nums[first[-1]] < x
              second.concat(moved.reverse)
              first << i
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Score of a Good Subarray (LC 1793) ─────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let best = 0;
      let leftMin = Infinity;
      for (let i = k; i >= 0; i--) {
        leftMin = Math.min(leftMin, nums[i]);
        let m = leftMin;
        for (let j = k; j < nums.length; j++) {
          m = Math.min(m, nums[j]);
          best = Math.max(best, m * (j - i + 1));
        }
      }
      return best;
    };
    return {
      slug: "maximum-score-of-a-good-subarray",
      title: "Maximum Score of a Good Subarray",
      difficulty: "HARD" as const,
      tags: ["Array", "Two Pointers", "Stack", "Monotonic Stack", "Google", "Amazon", "Microsoft"],
      signature: {
        funcName: "maximumScore",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` and an index `k`. The **score** of a subarray `nums[i..j]` is `min(nums[i..j]) * (j - i + 1)` — its smallest element times its length.\n\nA subarray is **good** when it contains index `k`, that is `i <= k <= j`. Return the maximum score over all good subarrays.",
        [
          { in: "nums = [2,6,4,8,3], k = 2", out: "12", note: "`[6,4,8]` scores 4 × 3 = 12, and so does `[6,4,8,3]` with 3 × 4." },
          { in: "nums = [7,1,7,7,7], k = 3", out: "21", note: "`[7,7,7]` (indices 2–4) avoids the 1." },
          { in: "nums = [5], k = 0", out: "5" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 2 * 10^4", "0 <= k < nums.length"]),
      hints: [
        "Every good subarray grows outward from index `k`. Think of starting with `[k, k]` and widening it one element at a time.",
        "When you widen, the minimum can only stay the same or drop. Which side should you take to keep it as high as possible?",
        "Always extend toward the larger of the two neighbours (`nums[i - 1]` vs `nums[j + 1]`), update the running minimum, and record `min × length` after every step.",
      ],
      editorial: explain({
        idea: "Grow the window from `[k, k]` greedily, always swallowing the larger neighbour. For every possible minimum value this reaches the widest good window with that minimum, so the best score is seen along the way.",
        steps: [
          "Set `i = j = k`, `cur = nums[k]`, `best = cur`.",
          "While the window can still grow: if the left end is at 0, or the right neighbour `nums[j + 1]` is larger than the left neighbour `nums[i - 1]`, extend right; otherwise extend left.",
          "Update `cur` to the minimum of the window and `best = max(best, cur × (j - i + 1))`.",
          "Return `best` once the window covers the whole array.",
        ],
        why: "Fix a threshold `v`. The widest good window whose elements are all `>= v` is the maximal run around `k` of elements `>= v`. The greedy never steps past an element smaller than `v` while a neighbour `>= v` is still available on the other side, so at some moment its window equals that maximal run — and at that moment its score is at least `v` times the run's length. Taking `v` as the minimum of the optimal subarray shows the greedy records a score at least as large as the optimum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Checking only subarrays that start or end at `k` misses windows spreading both ways.",
          "Handle the borders: once one side is exhausted, only the other side can grow.",
          "The product reaches 2 · 10^9 — near the top of int32, so compute it with care in languages that overflow silently.",
        ],
      }),
      examples: [
        { input: "[2,6,4,8,3]\n2", expectedOutput: "12" },
        { input: "[7,1,7,7,7]\n3", expectedOutput: "21" },
        { input: "[5]\n0", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 20, 20000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        if (rng() < 0.15) nums.sort((a, b) => a - b);
        const k = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumScore(nums: List[int], k: int) -> int:
              n = len(nums)
              i = j = k
              cur = nums[k]
              best = cur
              while i > 0 or j < n - 1:
                  if i == 0 or (j < n - 1 and nums[j + 1] > nums[i - 1]):
                      j += 1
                      cur = min(cur, nums[j])
                  else:
                      i -= 1
                      cur = min(cur, nums[i])
                  best = max(best, cur * (j - i + 1))
              return best
        `,
        javascript: code`
          var maximumScore = function(nums, k) {
              var n = nums.length;
              var i = k, j = k;
              var cur = nums[k], best = cur;
              while (i > 0 || j < n - 1) {
                  if (i === 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])) {
                      j++;
                      cur = Math.min(cur, nums[j]);
                  } else {
                      i--;
                      cur = Math.min(cur, nums[i]);
                  }
                  best = Math.max(best, cur * (j - i + 1));
              }
              return best;
          };
        `,
        typescript: code`
          function maximumScore(nums: number[], k: number): number {
              var n = nums.length;
              var i = k, j = k;
              var cur = nums[k], best = cur;
              while (i > 0 || j < n - 1) {
                  if (i === 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])) {
                      j++;
                      cur = Math.min(cur, nums[j]);
                  } else {
                      i--;
                      cur = Math.min(cur, nums[i]);
                  }
                  best = Math.max(best, cur * (j - i + 1));
              }
              return best;
          }
        `,
        java: code`
          public static int maximumScore(int[] nums, int k) {
              int n = nums.length;
              int i = k, j = k;
              int cur = nums[k];
              long best = cur;
              while (i > 0 || j < n - 1) {
                  if (i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])) {
                      j++;
                      cur = Math.min(cur, nums[j]);
                  } else {
                      i--;
                      cur = Math.min(cur, nums[i]);
                  }
                  best = Math.max(best, (long) cur * (j - i + 1));
              }
              return (int) best;
          }
        `,
        cpp: code`
          int maximumScore(vector<int>& nums, int k) {
              int n = nums.size();
              int i = k, j = k;
              int cur = nums[k];
              long long best = cur;
              while (i > 0 || j < n - 1) {
                  if (i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])) {
                      j++;
                      cur = min(cur, nums[j]);
                  } else {
                      i--;
                      cur = min(cur, nums[i]);
                  }
                  best = max(best, (long long)cur * (j - i + 1));
              }
              return (int)best;
          }
        `,
        c: code`
          int maximumScore(int* nums, int numsSize, int k) {
              int i = k, j = k;
              int cur = nums[k];
              long long best = cur;
              while (i > 0 || j < numsSize - 1) {
                  if (i == 0 || (j < numsSize - 1 && nums[j + 1] > nums[i - 1])) {
                      j++;
                      if (nums[j] < cur) cur = nums[j];
                  } else {
                      i--;
                      if (nums[i] < cur) cur = nums[i];
                  }
                  long long score = (long long)cur * (j - i + 1);
                  if (score > best) best = score;
              }
              return (int)best;
          }
        `,
        csharp: code`
          public static int MaximumScore(int[] nums, int k)
          {
              int n = nums.Length;
              int i = k, j = k;
              int cur = nums[k];
              long best = cur;
              while (i > 0 || j < n - 1)
              {
                  if (i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1]))
                  {
                      j++;
                      cur = Math.Min(cur, nums[j]);
                  }
                  else
                  {
                      i--;
                      cur = Math.Min(cur, nums[i]);
                  }
                  best = Math.Max(best, (long)cur * (j - i + 1));
              }
              return (int)best;
          }
        `,
        go: code`
          func maximumScore(nums []int, k int) int {
              n := len(nums)
              i, j := k, k
              cur := nums[k]
              best := cur
              for i > 0 || j < n-1 {
                  if i == 0 || (j < n-1 && nums[j+1] > nums[i-1]) {
                      j++
                      if nums[j] < cur {
                          cur = nums[j]
                      }
                  } else {
                      i--
                      if nums[i] < cur {
                          cur = nums[i]
                      }
                  }
                  if cur*(j-i+1) > best {
                      best = cur * (j - i + 1)
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maximumScore(nums: IntArray, k: Int): Int {
              val n = nums.size
              var i = k
              var j = k
              var cur = nums[k]
              var best = cur.toLong()
              while (i > 0 || j < n - 1) {
                  if (i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])) {
                      j++
                      cur = minOf(cur, nums[j])
                  } else {
                      i--
                      cur = minOf(cur, nums[i])
                  }
                  best = maxOf(best, cur.toLong() * (j - i + 1))
              }
              return best.toInt()
          }
        `,
        swift: code`
          func maximumScore(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var i = k
              var j = k
              var cur = nums[k]
              var best = cur
              while i > 0 || j < n - 1 {
                  if i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1]) {
                      j += 1
                      cur = min(cur, nums[j])
                  } else {
                      i -= 1
                      cur = min(cur, nums[i])
                  }
                  best = max(best, cur * (j - i + 1))
              }
              return best
          }
        `,
        rust: code`
          fn maximumScore(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let mut i = k as usize;
              let mut j = k as usize;
              let mut cur = nums[i] as i64;
              let mut best = cur;
              while i > 0 || j + 1 < n {
                  if i == 0 || (j + 1 < n && nums[j + 1] > nums[i - 1]) {
                      j += 1;
                      cur = cur.min(nums[j] as i64);
                  } else {
                      i -= 1;
                      cur = cur.min(nums[i] as i64);
                  }
                  best = best.max(cur * (j - i + 1) as i64);
              }
              best as i32
          }
        `,
        php: code`
          function maximumScore($nums, $k) {
              $n = count($nums);
              $i = $k;
              $j = $k;
              $cur = $nums[$k];
              $best = $cur;
              while ($i > 0 || $j < $n - 1) {
                  if ($i == 0 || ($j < $n - 1 && $nums[$j + 1] > $nums[$i - 1])) {
                      $j++;
                      if ($nums[$j] < $cur) $cur = $nums[$j];
                  } else {
                      $i--;
                      if ($nums[$i] < $cur) $cur = $nums[$i];
                  }
                  $score = $cur * ($j - $i + 1);
                  if ($score > $best) $best = $score;
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumScore(nums, k)
            n = nums.length
            i = j = k
            cur = nums[k]
            best = cur
            while i > 0 || j < n - 1
              if i == 0 || (j < n - 1 && nums[j + 1] > nums[i - 1])
                j += 1
                cur = nums[j] if nums[j] < cur
              else
                i -= 1
                cur = nums[i] if nums[i] < cur
              end
              score = cur * (j - i + 1)
              best = score if score > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Sum of Total Strength of Wizards (LC 2281) ─────────────────
  (() => {
    const MOD = 1000000007n;
    const ref = (s: number[]) => {
      let total = 0n;
      for (let i = 0; i < s.length; i++) {
        let mn = Infinity, sum = 0;
        for (let j = i; j < s.length; j++) {
          mn = Math.min(mn, s[j]);
          sum += s[j];
          total += BigInt(mn) * BigInt(sum);
        }
      }
      return Number(total % MOD);
    };
    return {
      slug: "sum-of-total-strength-of-wizards",
      title: "Sum of Total Strength of Wizards",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "totalStrength", params: [{ name: "strength", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A row of wizards stands in line; `strength[i]` is the strength of the `i`-th wizard. For any contiguous group of wizards (a non-empty subarray), its **total strength** is the strength of its **weakest** wizard multiplied by the **sum** of all strengths in the group.\n\nReturn the sum of the total strengths of **all** contiguous groups. The value can be huge, so return it modulo `10^9 + 7`.",
        [
          { in: "strength = [2,1,3]", out: "27", note: "The six groups give 2·2 + 1·1 + 3·3 + 1·3 + 1·4 + 1·6 = 4 + 1 + 9 + 3 + 4 + 6 = 27." },
          { in: "strength = [4,4]", out: "64", note: "4·4 + 4·4 + 4·8 = 64." },
          { in: "strength = [1000000000]", out: "49", note: "10^18 modulo 10^9 + 7 is 49." },
        ],
        ["1 <= strength.length <= 10^5", "1 <= strength[i] <= 10^9"]),
      hints: [
        "Flip the sum around: for each wizard, which groups is it the weakest member of?",
        "With a monotonic stack find, for every `i`, the span of groups in which `strength[i]` is the minimum. Break ties so each group is counted for exactly one index (strictly smaller on one side, smaller-or-equal on the other).",
        "You then need the sum of `sum(l..r)` over every `l` in a range and `r` in another range. With prefix sums `P` and prefix sums of prefix sums `PP`, that total is a difference of two products — O(1) per index.",
      ],
      editorial: explain({
        idea: "Count each group once, at the index of its minimum. For index `i` the groups where it is the minimum have their left end in `(L, i]` and right end in `[i, R)`, and the sum of all their sums collapses to a closed form over prefix sums of prefix sums.",
        steps: [
          "With a monotonic stack compute `L[i]`, the nearest index to the left with a strictly smaller strength (or -1), and `R[i]`, the nearest index to the right with a smaller-or-equal strength (or `n`).",
          "Build `P[t] = strength[0] + … + strength[t - 1]` and `PP[t] = P[0] + … + P[t - 1]`, all modulo `10^9 + 7`.",
          "The groups `[x, y]` with `L < x <= i <= y < R` have sums totalling `(i - L) · (PP[R + 1] - PP[i + 1]) - (R - i) · (PP[i + 1] - PP[L + 1])`.",
          "Add `strength[i]` times that total to the answer for every `i`, keeping everything reduced modulo `10^9 + 7`.",
        ],
        why: "The sum of a group `[x, y]` is `P[y + 1] - P[x]`. Summing over all `y` in `[i, R)` and `x` in `(L, i]` gives `(i - L) · ΣP[y + 1] - (R - i) · ΣP[x]`, and each of those Σ terms is a difference of two `PP` values. The asymmetric tie rule (strict on the left, non-strict on the right) assigns a group with a repeated minimum to the rightmost copy of that minimum only, so every group is counted exactly once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Using strict comparisons on both sides counts groups with equal minima twice; non-strict on both sides misses them.",
          "Products of two residues reach 10^18 — use 64-bit integers, and in JavaScript split one factor so no product passes 2^53.",
          "Subtractions under a modulus can go negative: add the modulus before reducing.",
        ],
      }),
      examples: [
        { input: "[2,1,3]", expectedOutput: "27" },
        { input: "[4,4]", expectedOutput: "64" },
        { input: "[1000000000]", expectedOutput: "49" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 50);
        const hi = pick(rng, [3, 50, 1000000000]);
        const s = Array.from({ length: n }, () => ri(rng, 1, hi));
        if (rng() < 0.15) s.sort((a, b) => a - b);
        return { input: fmtIntArr(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def totalStrength(strength: List[int]) -> int:
              MOD = 10**9 + 7
              n = len(strength)
              left = [-1] * n
              right = [n] * n
              st = []
              for i in range(n):
                  while st and strength[st[-1]] >= strength[i]:
                      right[st.pop()] = i
                  left[i] = st[-1] if st else -1
                  st.append(i)
              prefix = [0] * (n + 1)
              for i in range(n):
                  prefix[i + 1] = (prefix[i] + strength[i]) % MOD
              pp = [0] * (n + 2)
              for i in range(n + 1):
                  pp[i + 1] = (pp[i] + prefix[i]) % MOD
              total = 0
              for i in range(n):
                  l, r = left[i], right[i]
                  plus = (i - l) * (pp[r + 1] - pp[i + 1])
                  minus = (r - i) * (pp[i + 1] - pp[l + 1])
                  total = (total + strength[i] * ((plus - minus) % MOD)) % MOD
              return total
        `,
        javascript: code`
          var totalStrength = function(strength) {
              var MOD = 1000000007;
              var n = strength.length;
              var mulmod = function(a, b) {
                  return ((a * (b >>> 16)) % MOD * 65536 + a * (b & 65535)) % MOD;
              };
              var left = new Array(n), right = new Array(n).fill(n), st = [];
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && strength[st[st.length - 1]] >= strength[i]) right[st.pop()] = i;
                  left[i] = st.length > 0 ? st[st.length - 1] : -1;
                  st.push(i);
              }
              var prefix = new Array(n + 1).fill(0);
              for (var a = 0; a < n; a++) prefix[a + 1] = (prefix[a] + strength[a]) % MOD;
              var pp = new Array(n + 2).fill(0);
              for (var b = 0; b <= n; b++) pp[b + 1] = (pp[b] + prefix[b]) % MOD;
              var total = 0;
              for (var j = 0; j < n; j++) {
                  var l = left[j], r = right[j];
                  var plus = (j - l) * ((pp[r + 1] - pp[j + 1] + MOD) % MOD) % MOD;
                  var minus = (r - j) * ((pp[j + 1] - pp[l + 1] + MOD) % MOD) % MOD;
                  var diff = (plus - minus + MOD) % MOD;
                  total = (total + mulmod(strength[j], diff)) % MOD;
              }
              return total;
          };
        `,
        typescript: code`
          function totalStrength(strength: number[]): number {
              var MOD = 1000000007;
              var n = strength.length;
              var mulmod = function(a: number, b: number): number {
                  return ((a * (b >>> 16)) % MOD * 65536 + a * (b & 65535)) % MOD;
              };
              var left: number[] = [], right: number[] = [], st: number[] = [];
              for (var i = 0; i < n; i++) { left.push(-1); right.push(n); }
              for (var i2 = 0; i2 < n; i2++) {
                  while (st.length > 0 && strength[st[st.length - 1]] >= strength[i2]) right[st.pop() as number] = i2;
                  left[i2] = st.length > 0 ? st[st.length - 1] : -1;
                  st.push(i2);
              }
              var prefix: number[] = [0];
              for (var a = 0; a < n; a++) prefix.push((prefix[a] + strength[a]) % MOD);
              var pp: number[] = [0];
              for (var b = 0; b <= n; b++) pp.push((pp[b] + prefix[b]) % MOD);
              var total = 0;
              for (var j = 0; j < n; j++) {
                  var l = left[j], r = right[j];
                  var plus = (j - l) * ((pp[r + 1] - pp[j + 1] + MOD) % MOD) % MOD;
                  var minus = (r - j) * ((pp[j + 1] - pp[l + 1] + MOD) % MOD) % MOD;
                  var diff = (plus - minus + MOD) % MOD;
                  total = (total + mulmod(strength[j], diff)) % MOD;
              }
              return total;
          }
        `,
        java: code`
          public static int totalStrength(int[] strength) {
              final long MOD = 1000000007L;
              int n = strength.length;
              int[] left = new int[n], right = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  right[i] = n;
                  while (top > 0 && strength[st[top - 1]] >= strength[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              long[] prefix = new long[n + 1];
              for (int i = 0; i < n; i++) prefix[i + 1] = (prefix[i] + strength[i]) % MOD;
              long[] pp = new long[n + 2];
              for (int i = 0; i <= n; i++) pp[i + 1] = (pp[i] + prefix[i]) % MOD;
              long total = 0;
              for (int i = 0; i < n; i++) {
                  int l = left[i], r = right[i];
                  long plus = (long) (i - l) * ((pp[r + 1] - pp[i + 1] + MOD) % MOD) % MOD;
                  long minus = (long) (r - i) * ((pp[i + 1] - pp[l + 1] + MOD) % MOD) % MOD;
                  long diff = (plus - minus + MOD) % MOD;
                  total = (total + strength[i] * diff) % MOD;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int totalStrength(vector<int>& strength) {
              const long long MOD = 1000000007LL;
              int n = strength.size();
              vector<int> left(n, -1), right(n, n), st;
              for (int i = 0; i < n; i++) {
                  while (!st.empty() && strength[st.back()] >= strength[i]) {
                      right[st.back()] = i;
                      st.pop_back();
                  }
                  left[i] = st.empty() ? -1 : st.back();
                  st.push_back(i);
              }
              vector<long long> prefix(n + 1, 0), pp(n + 2, 0);
              for (int i = 0; i < n; i++) prefix[i + 1] = (prefix[i] + strength[i]) % MOD;
              for (int i = 0; i <= n; i++) pp[i + 1] = (pp[i] + prefix[i]) % MOD;
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  int l = left[i], r = right[i];
                  long long plus = (long long)(i - l) * ((pp[r + 1] - pp[i + 1] + MOD) % MOD) % MOD;
                  long long minus = (long long)(r - i) * ((pp[i + 1] - pp[l + 1] + MOD) % MOD) % MOD;
                  long long diff = (plus - minus + MOD) % MOD;
                  total = (total + (long long)strength[i] * diff) % MOD;
              }
              return (int)total;
          }
        `,
        c: code`
          int totalStrength(int* strength, int strengthSize) {
              const long long MOD = 1000000007LL;
              int n = strengthSize;
              int* left = (int*)malloc(sizeof(int) * (n + 1));
              int* right = (int*)malloc(sizeof(int) * (n + 1));
              int* st = (int*)malloc(sizeof(int) * (n + 1));
              long long* prefix = (long long*)malloc(sizeof(long long) * (n + 1));
              long long* pp = (long long*)malloc(sizeof(long long) * (n + 2));
              int top = 0;
              for (int i = 0; i < n; i++) {
                  right[i] = n;
                  while (top > 0 && strength[st[top - 1]] >= strength[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              prefix[0] = 0;
              for (int i = 0; i < n; i++) prefix[i + 1] = (prefix[i] + strength[i]) % MOD;
              pp[0] = 0;
              for (int i = 0; i <= n; i++) pp[i + 1] = (pp[i] + prefix[i]) % MOD;
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  int l = left[i], r = right[i];
                  long long plus = (long long)(i - l) * ((pp[r + 1] - pp[i + 1] + MOD) % MOD) % MOD;
                  long long minus = (long long)(r - i) * ((pp[i + 1] - pp[l + 1] + MOD) % MOD) % MOD;
                  long long diff = (plus - minus + MOD) % MOD;
                  total = (total + (long long)strength[i] * diff) % MOD;
              }
              free(left);
              free(right);
              free(st);
              free(prefix);
              free(pp);
              return (int)total;
          }
        `,
        csharp: code`
          public static int TotalStrength(int[] strength)
          {
              const long MOD = 1000000007L;
              int n = strength.Length;
              int[] left = new int[n], right = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  right[i] = n;
                  while (top > 0 && strength[st[top - 1]] >= strength[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              long[] prefix = new long[n + 1];
              for (int i = 0; i < n; i++) prefix[i + 1] = (prefix[i] + strength[i]) % MOD;
              long[] pp = new long[n + 2];
              for (int i = 0; i <= n; i++) pp[i + 1] = (pp[i] + prefix[i]) % MOD;
              long total = 0;
              for (int i = 0; i < n; i++)
              {
                  int l = left[i], r = right[i];
                  long plus = (long)(i - l) * ((pp[r + 1] - pp[i + 1] + MOD) % MOD) % MOD;
                  long minus = (long)(r - i) * ((pp[i + 1] - pp[l + 1] + MOD) % MOD) % MOD;
                  long diff = (plus - minus + MOD) % MOD;
                  total = (total + strength[i] * diff) % MOD;
              }
              return (int)total;
          }
        `,
        go: code`
          func totalStrength(strength []int) int {
              const MOD int64 = 1000000007
              n := len(strength)
              left := make([]int, n)
              right := make([]int, n)
              st := []int{}
              for i := 0; i < n; i++ {
                  right[i] = n
                  for len(st) > 0 && strength[st[len(st)-1]] >= strength[i] {
                      right[st[len(st)-1]] = i
                      st = st[:len(st)-1]
                  }
                  if len(st) > 0 {
                      left[i] = st[len(st)-1]
                  } else {
                      left[i] = -1
                  }
                  st = append(st, i)
              }
              prefix := make([]int64, n+1)
              for i := 0; i < n; i++ {
                  prefix[i+1] = (prefix[i] + int64(strength[i])) % MOD
              }
              pp := make([]int64, n+2)
              for i := 0; i <= n; i++ {
                  pp[i+1] = (pp[i] + prefix[i]) % MOD
              }
              var total int64
              for i := 0; i < n; i++ {
                  l, r := left[i], right[i]
                  plus := int64(i-l) * ((pp[r+1] - pp[i+1] + MOD) % MOD) % MOD
                  minus := int64(r-i) * ((pp[i+1] - pp[l+1] + MOD) % MOD) % MOD
                  diff := (plus - minus + MOD) % MOD
                  total = (total + int64(strength[i])*diff) % MOD
              }
              return int(total)
          }
        `,
        kotlin: code`
          fun totalStrength(strength: IntArray): Int {
              val MOD = 1000000007L
              val n = strength.size
              val left = IntArray(n)
              val right = IntArray(n) { n }
              val st = IntArray(n)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && strength[st[top - 1]] >= strength[i]) {
                      top--
                      right[st[top]] = i
                  }
                  left[i] = if (top > 0) st[top - 1] else -1
                  st[top++] = i
              }
              val prefix = LongArray(n + 1)
              for (i in 0 until n) prefix[i + 1] = (prefix[i] + strength[i]) % MOD
              val pp = LongArray(n + 2)
              for (i in 0..n) pp[i + 1] = (pp[i] + prefix[i]) % MOD
              var total = 0L
              for (i in 0 until n) {
                  val l = left[i]
                  val r = right[i]
                  val plus = (i - l).toLong() * ((pp[r + 1] - pp[i + 1] + MOD) % MOD) % MOD
                  val minus = (r - i).toLong() * ((pp[i + 1] - pp[l + 1] + MOD) % MOD) % MOD
                  val diff = (plus - minus + MOD) % MOD
                  total = (total + strength[i].toLong() * diff) % MOD
              }
              return total.toInt()
          }
        `,
        swift: code`
          func totalStrength(_ strength: [Int]) -> Int {
              let MOD = 1000000007
              let n = strength.count
              var left = [Int](repeating: -1, count: n)
              var right = [Int](repeating: n, count: n)
              var st = [Int]()
              for i in 0..<n {
                  while let top = st.last, strength[top] >= strength[i] {
                      right[top] = i
                      st.removeLast()
                  }
                  left[i] = st.last ?? -1
                  st.append(i)
              }
              var prefix = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { prefix[i + 1] = (prefix[i] + strength[i]) % MOD }
              var pp = [Int](repeating: 0, count: n + 2)
              for i in 0...n { pp[i + 1] = (pp[i] + prefix[i]) % MOD }
              var total = 0
              for i in 0..<n {
                  let l = left[i]
                  let r = right[i]
                  let plus = (i - l) * ((pp[r + 1] - pp[i + 1] + MOD) % MOD) % MOD
                  let minus = (r - i) * ((pp[i + 1] - pp[l + 1] + MOD) % MOD) % MOD
                  let diff = (plus - minus + MOD) % MOD
                  total = (total + strength[i] * diff) % MOD
              }
              return total
          }
        `,
        rust: code`
          fn totalStrength(strength: Vec<i32>) -> i32 {
              let modulo: i64 = 1000000007;
              let n = strength.len();
              let mut left: Vec<i64> = vec![-1; n];
              let mut right: Vec<i64> = vec![n as i64; n];
              let mut st: Vec<usize> = Vec::new();
              for i in 0..n {
                  while let Some(&top) = st.last() {
                      if strength[top] >= strength[i] {
                          right[top] = i as i64;
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  left[i] = match st.last() {
                      Some(&t) => t as i64,
                      None => -1,
                  };
                  st.push(i);
              }
              let mut prefix = vec![0i64; n + 1];
              for i in 0..n {
                  prefix[i + 1] = (prefix[i] + strength[i] as i64) % modulo;
              }
              let mut pp = vec![0i64; n + 2];
              for i in 0..=n {
                  pp[i + 1] = (pp[i] + prefix[i]) % modulo;
              }
              let mut total: i64 = 0;
              for i in 0..n {
                  let l = left[i];
                  let r = right[i];
                  let ii = i as i64;
                  let plus = (ii - l) * ((pp[(r + 1) as usize] - pp[i + 1] + modulo) % modulo) % modulo;
                  let minus = (r - ii) * ((pp[i + 1] - pp[(l + 1) as usize] + modulo) % modulo) % modulo;
                  let diff = (plus - minus + modulo) % modulo;
                  total = (total + strength[i] as i64 * diff) % modulo;
              }
              total as i32
          }
        `,
        php: code`
          function totalStrength($strength) {
              $MOD = 1000000007;
              $n = count($strength);
              $left = array_fill(0, $n, -1);
              $right = array_fill(0, $n, $n);
              $st = [];
              for ($i = 0; $i < $n; $i++) {
                  while (!empty($st) && $strength[$st[count($st) - 1]] >= $strength[$i]) {
                      $right[array_pop($st)] = $i;
                  }
                  $left[$i] = empty($st) ? -1 : $st[count($st) - 1];
                  $st[] = $i;
              }
              $prefix = [0];
              for ($i = 0; $i < $n; $i++) $prefix[] = ($prefix[$i] + $strength[$i]) % $MOD;
              $pp = [0];
              for ($i = 0; $i <= $n; $i++) $pp[] = ($pp[$i] + $prefix[$i]) % $MOD;
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  $l = $left[$i];
                  $r = $right[$i];
                  $plus = ($i - $l) * (($pp[$r + 1] - $pp[$i + 1] + $MOD) % $MOD) % $MOD;
                  $minus = ($r - $i) * (($pp[$i + 1] - $pp[$l + 1] + $MOD) % $MOD) % $MOD;
                  $diff = ($plus - $minus + $MOD) % $MOD;
                  $total = ($total + $strength[$i] * $diff) % $MOD;
              }
              return $total;
          }
        `,
        ruby: code`
          def totalStrength(strength)
            mod = 1_000_000_007
            n = strength.length
            left = Array.new(n, -1)
            right = Array.new(n, n)
            st = []
            n.times do |i|
              right[st.pop] = i while !st.empty? && strength[st[-1]] >= strength[i]
              left[i] = st.empty? ? -1 : st[-1]
              st << i
            end
            prefix = [0]
            n.times { |i| prefix << (prefix[i] + strength[i]) % mod }
            pp = [0]
            (0..n).each { |i| pp << (pp[i] + prefix[i]) % mod }
            total = 0
            n.times do |i|
              l = left[i]
              r = right[i]
              plus = (i - l) * (pp[r + 1] - pp[i + 1])
              minus = (r - i) * (pp[i + 1] - pp[l + 1])
              total = (total + strength[i] * ((plus - minus) % mod)) % mod
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Subarray Min-Product (LC 1856) ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        let mn = Infinity, sum = 0;
        for (let j = i; j < nums.length; j++) {
          mn = Math.min(mn, nums[j]);
          sum += nums[j];
          best = Math.max(best, mn * sum);
        }
      }
      return best % 1000000007;
    };
    return {
      slug: "maximum-subarray-min-product",
      title: "Maximum Subarray Min-Product",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "maxSumMinProduct", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **min-product** of an array is its minimum value multiplied by its sum; for example `[3,2,5]` has min-product `2 × (3 + 2 + 5) = 20`.\n\nGiven an array `nums` of positive integers, find the largest min-product over all of its non-empty subarrays. Compare the exact products; only the final maximum is reduced, and you return it modulo `10^9 + 7`.\n\n(The value bound below is tighter than the original problem's so that the exact maximum stays below 2^53.)",
        [
          { in: "nums = [3,1,4,4,2]", out: "32", note: "`[4,4]` gives 4 × 8 = 32." },
          { in: "nums = [2,5,4,1,3]", out: "36", note: "`[5,4]` gives 4 × 9 = 36." },
          { in: "nums = [100000,100000]", out: "999999867", note: "The whole array gives 100000 × 200000 = 2 · 10^10, which is 999999867 modulo 10^9 + 7." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Fix which element is the minimum. Since every value is positive, how far should the subarray extend around it?",
        "Around index `i`, extend left and right as long as the values are at least `nums[i]` — a longer subarray with the same minimum has a larger sum.",
        "Find those borders for every index with a monotonic stack (previous and next strictly smaller element) and read the sums from a prefix-sum array.",
      ],
      editorial: explain({
        idea: "For each index treated as the minimum, the best subarray is the widest one in which it stays the minimum. A monotonic stack finds every such window in linear time and a prefix sum prices it.",
        steps: [
          "Build prefix sums `P` (as 64-bit integers — sums reach 10^10).",
          "With a monotonic stack find `L[i]`, the previous index with a smaller value (or -1), and `R[i]`, the next index with a smaller-or-equal value (or `n`).",
          "Candidate for `i`: `nums[i] × (P[R[i]] - P[L[i] + 1])`. Track the maximum.",
          "Return the maximum modulo `10^9 + 7`.",
        ],
        why: "Take an optimal subarray and its minimum `m`. Because all values are positive, extending it over neighbours `>= m` keeps the minimum and grows the sum, so some optimal subarray is a maximal run of values `>= m`. The rightmost index holding `m` in that run has exactly that run as its window (strictly smaller to the left boundary, smaller-or-equal to the right one), so its candidate equals the optimum.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Take the maximum before the modulus — comparing reduced values picks the wrong subarray.",
          "Sums overflow 32 bits; keep prefix sums and products in 64-bit.",
          "Ties need no special care for a maximum: the rightmost copy of the minimum in a run sees the whole run, so stopping at equal values on the right loses nothing.",
        ],
      }),
      examples: [
        { input: "[3,1,4,4,2]", expectedOutput: "32" },
        { input: "[2,5,4,1,3]", expectedOutput: "36" },
        { input: "[100000,100000]", expectedOutput: "999999867" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [4, 100, 100000]);
        const lo = rng() < 0.3 ? Math.max(1, hi - 3) : 1;
        const nums = Array.from({ length: n }, () => ri(rng, lo, hi));
        if (rng() < 0.15) nums.sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSumMinProduct(nums: List[int]) -> int:
              n = len(nums)
              prefix = [0] * (n + 1)
              for i, x in enumerate(nums):
                  prefix[i + 1] = prefix[i] + x
              left = [-1] * n
              right = [n] * n
              st = []
              for i in range(n):
                  while st and nums[st[-1]] >= nums[i]:
                      right[st.pop()] = i
                  left[i] = st[-1] if st else -1
                  st.append(i)
              best = 0
              for i in range(n):
                  best = max(best, nums[i] * (prefix[right[i]] - prefix[left[i] + 1]))
              return best % (10**9 + 7)
        `,
        javascript: code`
          var maxSumMinProduct = function(nums) {
              var n = nums.length;
              var prefix = new Array(n + 1).fill(0);
              for (var i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
              var left = new Array(n), right = new Array(n).fill(n), st = [];
              for (var j = 0; j < n; j++) {
                  while (st.length > 0 && nums[st[st.length - 1]] >= nums[j]) right[st.pop()] = j;
                  left[j] = st.length > 0 ? st[st.length - 1] : -1;
                  st.push(j);
              }
              var best = 0;
              for (var k = 0; k < n; k++) {
                  var cand = nums[k] * (prefix[right[k]] - prefix[left[k] + 1]);
                  if (cand > best) best = cand;
              }
              return best % 1000000007;
          };
        `,
        typescript: code`
          function maxSumMinProduct(nums: number[]): number {
              var n = nums.length;
              var prefix: number[] = [0];
              for (var i = 0; i < n; i++) prefix.push(prefix[i] + nums[i]);
              var left: number[] = [], right: number[] = [], st: number[] = [];
              for (var a = 0; a < n; a++) { left.push(-1); right.push(n); }
              for (var j = 0; j < n; j++) {
                  while (st.length > 0 && nums[st[st.length - 1]] >= nums[j]) right[st.pop() as number] = j;
                  left[j] = st.length > 0 ? st[st.length - 1] : -1;
                  st.push(j);
              }
              var best = 0;
              for (var k = 0; k < n; k++) {
                  var cand = nums[k] * (prefix[right[k]] - prefix[left[k] + 1]);
                  if (cand > best) best = cand;
              }
              return best % 1000000007;
          }
        `,
        java: code`
          public static int maxSumMinProduct(int[] nums) {
              int n = nums.length;
              long[] prefix = new long[n + 1];
              for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
              int[] left = new int[n], right = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  right[i] = n;
                  while (top > 0 && nums[st[top - 1]] >= nums[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              long best = 0;
              for (int i = 0; i < n; i++) {
                  best = Math.max(best, nums[i] * (prefix[right[i]] - prefix[left[i] + 1]));
              }
              return (int) (best % 1000000007L);
          }
        `,
        cpp: code`
          int maxSumMinProduct(vector<int>& nums) {
              int n = nums.size();
              vector<long long> prefix(n + 1, 0);
              for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
              vector<int> left(n, -1), right(n, n), st;
              for (int i = 0; i < n; i++) {
                  while (!st.empty() && nums[st.back()] >= nums[i]) {
                      right[st.back()] = i;
                      st.pop_back();
                  }
                  left[i] = st.empty() ? -1 : st.back();
                  st.push_back(i);
              }
              long long best = 0;
              for (int i = 0; i < n; i++) {
                  best = max(best, (long long)nums[i] * (prefix[right[i]] - prefix[left[i] + 1]));
              }
              return (int)(best % 1000000007LL);
          }
        `,
        c: code`
          int maxSumMinProduct(int* nums, int numsSize) {
              int n = numsSize;
              long long* prefix = (long long*)malloc(sizeof(long long) * (n + 1));
              int* left = (int*)malloc(sizeof(int) * (n + 1));
              int* right = (int*)malloc(sizeof(int) * (n + 1));
              int* st = (int*)malloc(sizeof(int) * (n + 1));
              prefix[0] = 0;
              for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  right[i] = n;
                  while (top > 0 && nums[st[top - 1]] >= nums[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              long long best = 0;
              for (int i = 0; i < n; i++) {
                  long long cand = (long long)nums[i] * (prefix[right[i]] - prefix[left[i] + 1]);
                  if (cand > best) best = cand;
              }
              free(prefix);
              free(left);
              free(right);
              free(st);
              return (int)(best % 1000000007LL);
          }
        `,
        csharp: code`
          public static int MaxSumMinProduct(int[] nums)
          {
              int n = nums.Length;
              long[] prefix = new long[n + 1];
              for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
              int[] left = new int[n], right = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  right[i] = n;
                  while (top > 0 && nums[st[top - 1]] >= nums[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              long best = 0;
              for (int i = 0; i < n; i++)
              {
                  best = Math.Max(best, nums[i] * (prefix[right[i]] - prefix[left[i] + 1]));
              }
              return (int)(best % 1000000007L);
          }
        `,
        go: code`
          func maxSumMinProduct(nums []int) int {
              n := len(nums)
              prefix := make([]int64, n+1)
              for i := 0; i < n; i++ {
                  prefix[i+1] = prefix[i] + int64(nums[i])
              }
              left := make([]int, n)
              right := make([]int, n)
              st := []int{}
              for i := 0; i < n; i++ {
                  right[i] = n
                  for len(st) > 0 && nums[st[len(st)-1]] >= nums[i] {
                      right[st[len(st)-1]] = i
                      st = st[:len(st)-1]
                  }
                  if len(st) > 0 {
                      left[i] = st[len(st)-1]
                  } else {
                      left[i] = -1
                  }
                  st = append(st, i)
              }
              var best int64
              for i := 0; i < n; i++ {
                  cand := int64(nums[i]) * (prefix[right[i]] - prefix[left[i]+1])
                  if cand > best {
                      best = cand
                  }
              }
              return int(best % 1000000007)
          }
        `,
        kotlin: code`
          fun maxSumMinProduct(nums: IntArray): Int {
              val n = nums.size
              val prefix = LongArray(n + 1)
              for (i in 0 until n) prefix[i + 1] = prefix[i] + nums[i]
              val left = IntArray(n)
              val right = IntArray(n) { n }
              val st = IntArray(n)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && nums[st[top - 1]] >= nums[i]) {
                      top--
                      right[st[top]] = i
                  }
                  left[i] = if (top > 0) st[top - 1] else -1
                  st[top++] = i
              }
              var best = 0L
              for (i in 0 until n) {
                  best = maxOf(best, nums[i].toLong() * (prefix[right[i]] - prefix[left[i] + 1]))
              }
              return (best % 1000000007L).toInt()
          }
        `,
        swift: code`
          func maxSumMinProduct(_ nums: [Int]) -> Int {
              let n = nums.count
              var prefix = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { prefix[i + 1] = prefix[i] + nums[i] }
              var left = [Int](repeating: -1, count: n)
              var right = [Int](repeating: n, count: n)
              var st = [Int]()
              for i in 0..<n {
                  while let top = st.last, nums[top] >= nums[i] {
                      right[top] = i
                      st.removeLast()
                  }
                  left[i] = st.last ?? -1
                  st.append(i)
              }
              var best = 0
              for i in 0..<n {
                  best = max(best, nums[i] * (prefix[right[i]] - prefix[left[i] + 1]))
              }
              return best % 1000000007
          }
        `,
        rust: code`
          fn maxSumMinProduct(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut prefix = vec![0i64; n + 1];
              for i in 0..n {
                  prefix[i + 1] = prefix[i] + nums[i] as i64;
              }
              let mut left: Vec<usize> = vec![0; n];
              let mut right: Vec<usize> = vec![n; n];
              let mut st: Vec<usize> = Vec::new();
              for i in 0..n {
                  while let Some(&top) = st.last() {
                      if nums[top] >= nums[i] {
                          right[top] = i;
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  // left[i] holds the first index of the window (one past the smaller element)
                  left[i] = match st.last() {
                      Some(&t) => t + 1,
                      None => 0,
                  };
                  st.push(i);
              }
              let mut best: i64 = 0;
              for i in 0..n {
                  let cand = nums[i] as i64 * (prefix[right[i]] - prefix[left[i]]);
                  if cand > best {
                      best = cand;
                  }
              }
              (best % 1000000007) as i32
          }
        `,
        php: code`
          function maxSumMinProduct($nums) {
              $n = count($nums);
              $prefix = [0];
              for ($i = 0; $i < $n; $i++) $prefix[] = $prefix[$i] + $nums[$i];
              $left = array_fill(0, $n, -1);
              $right = array_fill(0, $n, $n);
              $st = [];
              for ($i = 0; $i < $n; $i++) {
                  while (!empty($st) && $nums[$st[count($st) - 1]] >= $nums[$i]) {
                      $right[array_pop($st)] = $i;
                  }
                  $left[$i] = empty($st) ? -1 : $st[count($st) - 1];
                  $st[] = $i;
              }
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  $cand = $nums[$i] * ($prefix[$right[$i]] - $prefix[$left[$i] + 1]);
                  if ($cand > $best) $best = $cand;
              }
              return $best % 1000000007;
          }
        `,
        ruby: code`
          def maxSumMinProduct(nums)
            n = nums.length
            prefix = [0]
            nums.each { |x| prefix << prefix[-1] + x }
            left = Array.new(n, -1)
            right = Array.new(n, n)
            st = []
            n.times do |i|
              right[st.pop] = i while !st.empty? && nums[st[-1]] >= nums[i]
              left[i] = st.empty? ? -1 : st[-1]
              st << i
            end
            best = 0
            n.times do |i|
              cand = nums[i] * (prefix[right[i]] - prefix[left[i] + 1])
              best = cand if cand > best
            end
            best % 1_000_000_007
          end
        `,
      },
    };
  })(),

  // ── Count Submatrices With All Ones (LC 1504) ──────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const m = mat.length, n = mat[0].length;
      const P: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) P[r + 1][c + 1] = P[r][c + 1] + P[r + 1][c] - P[r][c] + mat[r][c];
      let count = 0;
      for (let r1 = 0; r1 < m; r1++) for (let r2 = r1; r2 < m; r2++)
        for (let c1 = 0; c1 < n; c1++) for (let c2 = c1; c2 < n; c2++) {
          const ones = P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
          if (ones === (r2 - r1 + 1) * (c2 - c1 + 1)) count++;
        }
      return count;
    };
    return {
      slug: "count-submatrices-with-all-ones",
      title: "Count Submatrices With All Ones",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Matrix", "Monotonic Stack", "Google", "Amazon"],
      signature: { funcName: "numSubmat", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `m x n` binary matrix `mat`, count its **submatrices** (axis-aligned rectangles of cells, of any size from `1 x 1` up to `m x n`) in which every cell is `1`.",
        [
          { in: "mat = [[1,1],[1,1]]", out: "9", note: "Four 1×1, two 1×2, two 2×1 and one 2×2." },
          { in: "mat = [[1,0,1],[0,1,1]]", out: "6", note: "Four 1×1, the 1×2 in the bottom row and the 2×1 in the last column." },
          { in: "mat = [[0]]", out: "0" },
        ],
        ["1 <= m, n <= 150", "mat[i][j] is 0 or 1"]),
      hints: [
        "Count rectangles by their bottom-right corner. Fix the bottom row and look up: each column has a height of consecutive 1s ending at that row.",
        "For bottom-right corner `(r, c)`, the number of all-ones rectangles is the sum over left columns `k <= c` of `min(h[k..c])`.",
        "That running-minimum sum is what a monotonic stack computes: with `p` the previous column whose height is smaller than `h[c]`, `count[c] = count[p] + h[c] × (c - p)`.",
      ],
      editorial: explain({
        idea: "Turn each row into a histogram of upward runs of 1s; the rectangles with their bottom-right corner at `(r, c)` number `Σ min(h[k..c])` over left edges `k`, which a monotonic stack maintains in O(1) amortised per cell.",
        steps: [
          "Keep `h[c]`, the number of consecutive 1s ending at the current row in column `c` (reset to 0 on a 0).",
          "For each row, sweep the columns left to right with a stack of column indices of strictly increasing height.",
          "Pop while the top's height is `>= h[c]`. If a column `p` remains, `count[c] = count[p] + h[c] × (c - p)`; otherwise `count[c] = h[c] × (c + 1)`.",
          "Add `count[c]` to the total and push `c`.",
        ],
        why: "A rectangle with bottom-right corner `(r, c)` and left column `k` can be any height up to `min(h[k..c])`, so that is how many there are. For left columns between `p + 1` and `c` the minimum is `h[c]` itself (they are all at least as tall), giving `h[c] × (c - p)`; for left columns `<= p` the minimum over `[k, c]` equals the minimum over `[k, p]` because `h[p] < h[c]`, which is exactly `count[p]`.",
        time: "O(m · n)",
        space: "O(n)",
        pitfalls: [
          "Counting only squares, or only full-width rows, misses most rectangles.",
          "Reset `h[c]` to 0 on a 0 cell — heights are consecutive runs, not column totals.",
          "An O(m² · n²) enumeration with prefix sums is correct but too slow at 150 × 150.",
        ],
      }),
      examples: [
        { input: "[[1,1],[1,1]]", expectedOutput: "9" },
        { input: "[[1,0,1],[0,1,1]]", expectedOutput: "6" },
        { input: "[[0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 8]));
        const n = ri(rng, 1, pick(rng, [1, 3, 8]));
        const p = pick(rng, [0.3, 0.6, 0.85, 1]);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numSubmat(mat: List[List[int]]) -> int:
              m, n = len(mat), len(mat[0])
              h = [0] * n
              total = 0
              for r in range(m):
                  for c in range(n):
                      h[c] = h[c] + 1 if mat[r][c] == 1 else 0
                  cnt = [0] * n
                  st = []
                  for c in range(n):
                      while st and h[st[-1]] >= h[c]:
                          st.pop()
                      if st:
                          p = st[-1]
                          cnt[c] = cnt[p] + h[c] * (c - p)
                      else:
                          cnt[c] = h[c] * (c + 1)
                      total += cnt[c]
                      st.append(c)
              return total
        `,
        javascript: code`
          var numSubmat = function(mat) {
              var m = mat.length, n = mat[0].length;
              var h = new Array(n).fill(0);
              var total = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) h[c] = mat[r][c] === 1 ? h[c] + 1 : 0;
                  var cnt = new Array(n).fill(0);
                  var st = [];
                  for (var c2 = 0; c2 < n; c2++) {
                      while (st.length > 0 && h[st[st.length - 1]] >= h[c2]) st.pop();
                      if (st.length > 0) {
                          var p = st[st.length - 1];
                          cnt[c2] = cnt[p] + h[c2] * (c2 - p);
                      } else {
                          cnt[c2] = h[c2] * (c2 + 1);
                      }
                      total += cnt[c2];
                      st.push(c2);
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function numSubmat(mat: number[][]): number {
              var m = mat.length, n = mat[0].length;
              var h: number[] = [];
              for (var i = 0; i < n; i++) h.push(0);
              var total = 0;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) h[c] = mat[r][c] === 1 ? h[c] + 1 : 0;
                  var cnt: number[] = [];
                  var st: number[] = [];
                  for (var c2 = 0; c2 < n; c2++) {
                      while (st.length > 0 && h[st[st.length - 1]] >= h[c2]) st.pop();
                      if (st.length > 0) {
                          var p = st[st.length - 1];
                          cnt.push(cnt[p] + h[c2] * (c2 - p));
                      } else {
                          cnt.push(h[c2] * (c2 + 1));
                      }
                      total += cnt[c2];
                      st.push(c2);
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int numSubmat(int[][] mat) {
              int m = mat.length, n = mat[0].length;
              int[] h = new int[n], cnt = new int[n], st = new int[n];
              int total = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) h[c] = mat[r][c] == 1 ? h[c] + 1 : 0;
                  int top = 0;
                  for (int c = 0; c < n; c++) {
                      while (top > 0 && h[st[top - 1]] >= h[c]) top--;
                      if (top > 0) {
                          int p = st[top - 1];
                          cnt[c] = cnt[p] + h[c] * (c - p);
                      } else {
                          cnt[c] = h[c] * (c + 1);
                      }
                      total += cnt[c];
                      st[top++] = c;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int numSubmat(vector<vector<int>>& mat) {
              int m = mat.size(), n = mat[0].size();
              vector<int> h(n, 0), cnt(n, 0), st;
              int total = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) h[c] = mat[r][c] == 1 ? h[c] + 1 : 0;
                  st.clear();
                  for (int c = 0; c < n; c++) {
                      while (!st.empty() && h[st.back()] >= h[c]) st.pop_back();
                      if (!st.empty()) {
                          int p = st.back();
                          cnt[c] = cnt[p] + h[c] * (c - p);
                      } else {
                          cnt[c] = h[c] * (c + 1);
                      }
                      total += cnt[c];
                      st.push_back(c);
                  }
              }
              return total;
          }
        `,
        c: code`
          int numSubmat(int** mat, int matSize, int* matColSize) {
              int m = matSize, n = matColSize[0];
              int* h = (int*)calloc(n, sizeof(int));
              int* cnt = (int*)calloc(n, sizeof(int));
              int* st = (int*)malloc(sizeof(int) * n);
              int total = 0;
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) h[c] = mat[r][c] == 1 ? h[c] + 1 : 0;
                  int top = 0;
                  for (int c = 0; c < n; c++) {
                      while (top > 0 && h[st[top - 1]] >= h[c]) top--;
                      if (top > 0) {
                          int p = st[top - 1];
                          cnt[c] = cnt[p] + h[c] * (c - p);
                      } else {
                          cnt[c] = h[c] * (c + 1);
                      }
                      total += cnt[c];
                      st[top++] = c;
                  }
              }
              free(h);
              free(cnt);
              free(st);
              return total;
          }
        `,
        csharp: code`
          public static int NumSubmat(int[][] mat)
          {
              int m = mat.Length, n = mat[0].Length;
              int[] h = new int[n], cnt = new int[n], st = new int[n];
              int total = 0;
              for (int r = 0; r < m; r++)
              {
                  for (int c = 0; c < n; c++) h[c] = mat[r][c] == 1 ? h[c] + 1 : 0;
                  int top = 0;
                  for (int c = 0; c < n; c++)
                  {
                      while (top > 0 && h[st[top - 1]] >= h[c]) top--;
                      if (top > 0)
                      {
                          int p = st[top - 1];
                          cnt[c] = cnt[p] + h[c] * (c - p);
                      }
                      else
                      {
                          cnt[c] = h[c] * (c + 1);
                      }
                      total += cnt[c];
                      st[top++] = c;
                  }
              }
              return total;
          }
        `,
        go: code`
          func numSubmat(mat [][]int) int {
              m, n := len(mat), len(mat[0])
              h := make([]int, n)
              cnt := make([]int, n)
              total := 0
              for r := 0; r < m; r++ {
                  for c := 0; c < n; c++ {
                      if mat[r][c] == 1 {
                          h[c]++
                      } else {
                          h[c] = 0
                      }
                  }
                  st := []int{}
                  for c := 0; c < n; c++ {
                      for len(st) > 0 && h[st[len(st)-1]] >= h[c] {
                          st = st[:len(st)-1]
                      }
                      if len(st) > 0 {
                          p := st[len(st)-1]
                          cnt[c] = cnt[p] + h[c]*(c-p)
                      } else {
                          cnt[c] = h[c] * (c + 1)
                      }
                      total += cnt[c]
                      st = append(st, c)
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun numSubmat(mat: Array<IntArray>): Int {
              val m = mat.size
              val n = mat[0].size
              val h = IntArray(n)
              val cnt = IntArray(n)
              val st = IntArray(n)
              var total = 0
              for (r in 0 until m) {
                  for (c in 0 until n) h[c] = if (mat[r][c] == 1) h[c] + 1 else 0
                  var top = 0
                  for (c in 0 until n) {
                      while (top > 0 && h[st[top - 1]] >= h[c]) top--
                      if (top > 0) {
                          val p = st[top - 1]
                          cnt[c] = cnt[p] + h[c] * (c - p)
                      } else {
                          cnt[c] = h[c] * (c + 1)
                      }
                      total += cnt[c]
                      st[top++] = c
                  }
              }
              return total
          }
        `,
        swift: code`
          func numSubmat(_ mat: [[Int]]) -> Int {
              let m = mat.count
              let n = mat[0].count
              var h = [Int](repeating: 0, count: n)
              var cnt = [Int](repeating: 0, count: n)
              var total = 0
              for r in 0..<m {
                  for c in 0..<n { h[c] = mat[r][c] == 1 ? h[c] + 1 : 0 }
                  var st = [Int]()
                  for c in 0..<n {
                      while let top = st.last, h[top] >= h[c] { st.removeLast() }
                      if let p = st.last {
                          cnt[c] = cnt[p] + h[c] * (c - p)
                      } else {
                          cnt[c] = h[c] * (c + 1)
                      }
                      total += cnt[c]
                      st.append(c)
                  }
              }
              return total
          }
        `,
        rust: code`
          fn numSubmat(mat: Vec<Vec<i32>>) -> i32 {
              let m = mat.len();
              let n = mat[0].len();
              let mut h = vec![0i32; n];
              let mut cnt = vec![0i32; n];
              let mut total: i32 = 0;
              for r in 0..m {
                  for c in 0..n {
                      h[c] = if mat[r][c] == 1 { h[c] + 1 } else { 0 };
                  }
                  let mut st: Vec<usize> = Vec::new();
                  for c in 0..n {
                      while let Some(&top) = st.last() {
                          if h[top] >= h[c] {
                              st.pop();
                          } else {
                              break;
                          }
                      }
                      cnt[c] = match st.last() {
                          Some(&p) => cnt[p] + h[c] * (c - p) as i32,
                          None => h[c] * (c + 1) as i32,
                      };
                      total += cnt[c];
                      st.push(c);
                  }
              }
              total
          }
        `,
        php: code`
          function numSubmat($mat) {
              $m = count($mat);
              $n = count($mat[0]);
              $h = array_fill(0, $n, 0);
              $cnt = array_fill(0, $n, 0);
              $total = 0;
              for ($r = 0; $r < $m; $r++) {
                  for ($c = 0; $c < $n; $c++) $h[$c] = $mat[$r][$c] == 1 ? $h[$c] + 1 : 0;
                  $st = [];
                  for ($c = 0; $c < $n; $c++) {
                      while (!empty($st) && $h[$st[count($st) - 1]] >= $h[$c]) array_pop($st);
                      if (!empty($st)) {
                          $p = $st[count($st) - 1];
                          $cnt[$c] = $cnt[$p] + $h[$c] * ($c - $p);
                      } else {
                          $cnt[$c] = $h[$c] * ($c + 1);
                      }
                      $total += $cnt[$c];
                      $st[] = $c;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def numSubmat(mat)
            m = mat.length
            n = mat[0].length
            h = Array.new(n, 0)
            cnt = Array.new(n, 0)
            total = 0
            m.times do |r|
              n.times { |c| h[c] = mat[r][c] == 1 ? h[c] + 1 : 0 }
              st = []
              n.times do |c|
                st.pop while !st.empty? && h[st[-1]] >= h[c]
                if st.empty?
                  cnt[c] = h[c] * (c + 1)
                else
                  p = st[-1]
                  cnt[c] = cnt[p] + h[c] * (c - p)
                end
                total += cnt[c]
                st << c
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Largest Number After Mutating Substring (LC 1946) ──────────
  (() => {
    const ref = (num: string, change: number[]) => {
      let best = num;
      for (let i = 0; i < num.length; i++) {
        for (let j = i; j < num.length; j++) {
          let s = num.slice(0, i);
          for (let t = i; t <= j; t++) s += String(change[num.charCodeAt(t) - 48]);
          s += num.slice(j + 1);
          if (s > best) best = s;
        }
      }
      return best;
    };
    return {
      slug: "largest-number-after-mutating-substring",
      title: "Largest Number After Mutating Substring",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Greedy", "Amazon", "Google"],
      signature: {
        funcName: "maximumNumber",
        params: [{ name: "num", type: "string" as const }, { name: "change", type: "int[]" as const }],
        returns: "string" as const,
      },
      description: describe(
        "`num` is a large integer written as a string of digits, and `change` is an array of 10 digits that maps each digit `d` to `change[d]`.\n\nYou may **mutate** one contiguous substring of `num` — replace every digit `d` in it by `change[d]` — or leave `num` unchanged. Return the largest integer you can obtain, as a string.",
        [
          { in: "num = \"214\", change = [0,1,9,3,4,5,6,7,8,9]", out: "914", note: "Mutating just the first digit turns 2 into 9." },
          { in: "num = \"5\", change = [1,4,7,5,3,2,5,6,9,4]", out: "5", note: "5 would become 2, so it is better not to mutate anything." },
          { in: "num = \"3809\", change = [0,1,2,7,4,5,6,7,5,9]", out: "7809", note: "3 becomes 7, but extending the substring over the 8 would turn it into a 5." },
        ],
        ["1 <= num.length <= 10^5", "num consists of digits only", "change.length == 10", "0 <= change[d] <= 9"]),
      hints: [
        "All results have the same length, so the leftmost digit you can raise matters more than everything after it.",
        "Start the substring at the first digit `d` with `change[d] > d`.",
        "Then keep extending while `change[d] >= d` and stop at the first digit that would get smaller.",
      ],
      editorial: explain({
        idea: "Numbers of equal length compare like strings, so raise the leftmost digit that can be raised, then keep mutating for as long as no digit gets worse.",
        steps: [
          "Scan for the first index `i` whose digit `d` has `change[d] > d`. If there is none, return `num` unchanged.",
          "From `i`, replace each digit `d` by `change[d]` while `change[d] >= d`.",
          "Stop at the first digit with `change[d] < d` (or the end) and return the result.",
        ],
        why: "Any mutation that leaves the first improvable position `i` untouched cannot beat one that raises it: positions before `i` can only stay equal or drop, and raising position `i` wins the comparison there. Once started at `i`, extending over a digit that stays equal or grows never hurts, while including a digit that shrinks makes the number smaller at that position — and since the substring must be contiguous, nothing after it can be mutated anyway.",
        time: "O(n)",
        space: "O(n) for the output string",
        pitfalls: [
          "Digits with `change[d] == d` must not *start* the substring (it gains nothing) but must not *stop* it either.",
          "Only one substring may be mutated: do not resume after stopping.",
          "Mutating nothing is allowed — return `num` when no digit improves.",
        ],
      }),
      examples: [
        { input: "\"214\"\n[0,1,9,3,4,5,6,7,8,9]", expectedOutput: "914" },
        { input: "\"5\"\n[1,4,7,5,3,2,5,6,9,4]", expectedOutput: "5" },
        { input: "\"3809\"\n[0,1,2,7,4,5,6,7,5,9]", expectedOutput: "7809" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 6, 20]));
        let num = String(ri(rng, 1, 9));
        for (let i = 1; i < n; i++) num += String(ri(rng, 0, 9));
        const keep = pick(rng, [0, 0.4, 0.7]);
        const change = Array.from({ length: 10 }, (_, d) => (rng() < keep ? d : ri(rng, 0, 9)));
        return { input: `"${num}"\n${fmtIntArr(change)}`, expectedOutput: ref(num, change) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumNumber(num: str, change: List[int]) -> str:
              digits = list(num)
              n = len(digits)
              i = 0
              while i < n and change[int(digits[i])] <= int(digits[i]):
                  i += 1
              while i < n and change[int(digits[i])] >= int(digits[i]):
                  digits[i] = str(change[int(digits[i])])
                  i += 1
              return ''.join(digits)
        `,
        javascript: code`
          var maximumNumber = function(num, change) {
              var digits = num.split("");
              var n = digits.length, i = 0;
              while (i < n && change[+digits[i]] <= +digits[i]) i++;
              while (i < n && change[+digits[i]] >= +digits[i]) {
                  digits[i] = String(change[+digits[i]]);
                  i++;
              }
              return digits.join("");
          };
        `,
        typescript: code`
          function maximumNumber(num: string, change: number[]): string {
              var digits: number[] = [];
              for (var k = 0; k < num.length; k++) digits.push(num.charCodeAt(k) - 48);
              var n = digits.length, i = 0;
              while (i < n && change[digits[i]] <= digits[i]) i++;
              while (i < n && change[digits[i]] >= digits[i]) {
                  digits[i] = change[digits[i]];
                  i++;
              }
              return digits.join("");
          }
        `,
        java: code`
          public static String maximumNumber(String num, int[] change) {
              char[] digits = num.toCharArray();
              int n = digits.length, i = 0;
              while (i < n && change[digits[i] - '0'] <= digits[i] - '0') i++;
              while (i < n && change[digits[i] - '0'] >= digits[i] - '0') {
                  digits[i] = (char) ('0' + change[digits[i] - '0']);
                  i++;
              }
              return new String(digits);
          }
        `,
        cpp: code`
          string maximumNumber(string num, vector<int>& change) {
              int n = num.size(), i = 0;
              while (i < n && change[num[i] - '0'] <= num[i] - '0') i++;
              while (i < n && change[num[i] - '0'] >= num[i] - '0') {
                  num[i] = (char)('0' + change[num[i] - '0']);
                  i++;
              }
              return num;
          }
        `,
        c: code`
          char* maximumNumber(const char* num, int* change, int changeSize) {
              int n = (int)strlen(num);
              char* out = (char*)malloc(n + 1);
              memcpy(out, num, n + 1);
              int i = 0;
              while (i < n && change[out[i] - '0'] <= out[i] - '0') i++;
              while (i < n && change[out[i] - '0'] >= out[i] - '0') {
                  out[i] = (char)('0' + change[out[i] - '0']);
                  i++;
              }
              return out;
          }
        `,
        csharp: code`
          public static string MaximumNumber(string num, int[] change)
          {
              char[] digits = num.ToCharArray();
              int n = digits.Length, i = 0;
              while (i < n && change[digits[i] - '0'] <= digits[i] - '0') i++;
              while (i < n && change[digits[i] - '0'] >= digits[i] - '0')
              {
                  digits[i] = (char)('0' + change[digits[i] - '0']);
                  i++;
              }
              return new string(digits);
          }
        `,
        go: code`
          func maximumNumber(num string, change []int) string {
              digits := []byte(num)
              n, i := len(digits), 0
              for i < n && change[int(digits[i]-'0')] <= int(digits[i]-'0') {
                  i++
              }
              for i < n && change[int(digits[i]-'0')] >= int(digits[i]-'0') {
                  digits[i] = byte('0' + change[int(digits[i]-'0')])
                  i++
              }
              return string(digits)
          }
        `,
        kotlin: code`
          fun maximumNumber(num: String, change: IntArray): String {
              val digits = num.toCharArray()
              val n = digits.size
              var i = 0
              while (i < n && change[digits[i] - '0'] <= digits[i] - '0') i++
              while (i < n && change[digits[i] - '0'] >= digits[i] - '0') {
                  digits[i] = '0' + change[digits[i] - '0']
                  i++
              }
              return String(digits)
          }
        `,
        swift: code`
          func maximumNumber(_ num: String, _ change: [Int]) -> String {
              var digits = Array(num.utf8)
              let n = digits.count
              var i = 0
              while i < n && change[Int(digits[i]) - 48] <= Int(digits[i]) - 48 { i += 1 }
              while i < n && change[Int(digits[i]) - 48] >= Int(digits[i]) - 48 {
                  digits[i] = UInt8(48 + change[Int(digits[i]) - 48])
                  i += 1
              }
              return String(decoding: digits, as: UTF8.self)
          }
        `,
        rust: code`
          fn maximumNumber(num: String, change: Vec<i32>) -> String {
              let mut digits = num.into_bytes();
              let n = digits.len();
              let mut i = 0;
              while i < n && change[(digits[i] - b'0') as usize] <= (digits[i] - b'0') as i32 {
                  i += 1;
              }
              while i < n && change[(digits[i] - b'0') as usize] >= (digits[i] - b'0') as i32 {
                  digits[i] = b'0' + change[(digits[i] - b'0') as usize] as u8;
                  i += 1;
              }
              String::from_utf8(digits).unwrap()
          }
        `,
        php: code`
          function maximumNumber($num, $change) {
              $n = strlen($num);
              $i = 0;
              while ($i < $n && $change[(int)$num[$i]] <= (int)$num[$i]) $i++;
              while ($i < $n && $change[(int)$num[$i]] >= (int)$num[$i]) {
                  $num[$i] = (string)$change[(int)$num[$i]];
                  $i++;
              }
              return $num;
          }
        `,
        ruby: code`
          def maximumNumber(num, change)
            digits = num.chars.map(&:to_i)
            n = digits.length
            i = 0
            i += 1 while i < n && change[digits[i]] <= digits[i]
            while i < n && change[digits[i]] >= digits[i]
              digits[i] = change[digits[i]]
              i += 1
            end
            digits.join
          end
        `,
      },
    };
  })(),

  // ── Find the Most Competitive Subsequence (LC 1673) ────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      // pick the leftmost minimum of each feasible window
      const out: number[] = [];
      let from = 0;
      for (let need = k; need > 0; need--) {
        let best = from;
        for (let i = from; i <= nums.length - need; i++) if (nums[i] < nums[best]) best = i;
        out.push(nums[best]);
        from = best + 1;
      }
      return out;
    };
    return {
      slug: "find-the-most-competitive-subsequence",
      title: "Find the Most Competitive Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Greedy", "Monotonic Stack", "Google", "Uber", "Amazon"],
      signature: {
        funcName: "mostCompetitive",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "A subsequence keeps some elements of an array in their original order. Among subsequences of the same length, `a` is **more competitive** than `b` if, at the first position where they differ, `a` has the smaller number — for example `[1,3,4]` beats `[1,3,5]`.\n\nGiven `nums` and a length `k`, return the most competitive subsequence of `nums` of size `k`.",
        [
          { in: "nums = [4,1,7,3,8], k = 2", out: "[1,3]" },
          { in: "nums = [5,4,3,2,1], k = 3", out: "[3,2,1]", note: "The first pick must leave room for two more elements, so it can only come from [5,4,3]." },
          { in: "nums = [2,2,1,2], k = 3", out: "[2,1,2]" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^9", "1 <= k <= nums.length"]),
      hints: [
        "This is the 'smallest subsequence of length k' problem: earlier positions dominate later ones.",
        "Build the answer on a stack. When a smaller number arrives, the larger numbers on top of the stack would be better replaced — as long as enough elements remain to still reach length `k`.",
        "Pop while the top is larger than the current number and `stack size - 1 + remaining elements >= k`; push the current number if the stack has fewer than `k` items.",
      ],
      editorial: explain({
        idea: "Greedy with a monotonic stack: a kept element should be thrown out the moment a smaller element appears after it, provided the remaining elements can still fill the subsequence to length `k`.",
        steps: [
          "Scan `nums` with index `i`, keeping a stack `st` of the chosen elements.",
          "While `st` is non-empty, its top is greater than `nums[i]`, and `st.length - 1 + (n - i) >= k`, pop.",
          "If `st.length < k`, push `nums[i]`.",
          "After the scan, `st` holds exactly `k` elements — the answer.",
        ],
        why: "Whenever `top > nums[i]` and enough elements remain, replacing the top by `nums[i]` makes the sequence smaller at that position, and the earliest differing position decides the comparison, so the pop can never hurt. The feasibility check guarantees the stack can still be filled to `k`. A stack left non-decreasing wherever a pop was allowed is exactly the lexicographically smallest feasible choice.",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "Without the remaining-count check the stack can end shorter than `k` (e.g. a strictly decreasing array).",
          "Pop on strictly greater only — popping equal values gains nothing and can waste needed elements.",
          "Do not push once the stack already holds `k` elements.",
        ],
      }),
      examples: [
        { input: "[4,1,7,3,8]\n2", expectedOutput: "[1,3]" },
        { input: "[5,4,3,2,1]\n3", expectedOutput: "[3,2,1]" },
        { input: "[2,2,1,2]\n3", expectedOutput: "[2,1,2]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 20, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const shape = ri(rng, 0, 6);
        if (shape === 0) nums.sort((a, b) => a - b);
        else if (shape === 1) nums.sort((a, b) => b - a);
        const k = pick(rng, [1, n, ri(rng, 1, n)]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def mostCompetitive(nums: List[int], k: int) -> List[int]:
              n = len(nums)
              st = []
              for i, x in enumerate(nums):
                  while st and st[-1] > x and len(st) - 1 + (n - i) >= k:
                      st.pop()
                  if len(st) < k:
                      st.append(x)
              return st
        `,
        javascript: code`
          var mostCompetitive = function(nums, k) {
              var n = nums.length, st = [];
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && st[st.length - 1] > nums[i] && st.length - 1 + (n - i) >= k) st.pop();
                  if (st.length < k) st.push(nums[i]);
              }
              return st;
          };
        `,
        typescript: code`
          function mostCompetitive(nums: number[], k: number): number[] {
              var n = nums.length;
              var st: number[] = [];
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && st[st.length - 1] > nums[i] && st.length - 1 + (n - i) >= k) st.pop();
                  if (st.length < k) st.push(nums[i]);
              }
              return st;
          }
        `,
        java: code`
          public static int[] mostCompetitive(int[] nums, int k) {
              int n = nums.length;
              int[] st = new int[k];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  while (top > 0 && st[top - 1] > nums[i] && top - 1 + (n - i) >= k) top--;
                  if (top < k) st[top++] = nums[i];
              }
              return st;
          }
        `,
        cpp: code`
          vector<int> mostCompetitive(vector<int>& nums, int k) {
              int n = nums.size();
              vector<int> st;
              for (int i = 0; i < n; i++) {
                  while (!st.empty() && st.back() > nums[i] && (int)st.size() - 1 + (n - i) >= k) st.pop_back();
                  if ((int)st.size() < k) st.push_back(nums[i]);
              }
              return st;
          }
        `,
        c: code`
          int* mostCompetitive(int* nums, int numsSize, int k, int* returnSize) {
              int* st = (int*)malloc(sizeof(int) * (k > 0 ? k : 1));
              int top = 0;
              for (int i = 0; i < numsSize; i++) {
                  while (top > 0 && st[top - 1] > nums[i] && top - 1 + (numsSize - i) >= k) top--;
                  if (top < k) st[top++] = nums[i];
              }
              *returnSize = top;
              return st;
          }
        `,
        csharp: code`
          public static int[] MostCompetitive(int[] nums, int k)
          {
              int n = nums.Length;
              int[] st = new int[k];
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  while (top > 0 && st[top - 1] > nums[i] && top - 1 + (n - i) >= k) top--;
                  if (top < k) st[top++] = nums[i];
              }
              return st;
          }
        `,
        go: code`
          func mostCompetitive(nums []int, k int) []int {
              n := len(nums)
              st := []int{}
              for i := 0; i < n; i++ {
                  for len(st) > 0 && st[len(st)-1] > nums[i] && len(st)-1+(n-i) >= k {
                      st = st[:len(st)-1]
                  }
                  if len(st) < k {
                      st = append(st, nums[i])
                  }
              }
              return st
          }
        `,
        kotlin: code`
          fun mostCompetitive(nums: IntArray, k: Int): IntArray {
              val n = nums.size
              val st = IntArray(k)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && st[top - 1] > nums[i] && top - 1 + (n - i) >= k) top--
                  if (top < k) st[top++] = nums[i]
              }
              return st
          }
        `,
        swift: code`
          func mostCompetitive(_ nums: [Int], _ k: Int) -> [Int] {
              let n = nums.count
              var st = [Int]()
              for i in 0..<n {
                  while let last = st.last, last > nums[i], st.count - 1 + (n - i) >= k {
                      st.removeLast()
                  }
                  if st.count < k { st.append(nums[i]) }
              }
              return st
          }
        `,
        rust: code`
          fn mostCompetitive(nums: Vec<i32>, k: i32) -> Vec<i32> {
              let n = nums.len();
              let k = k as usize;
              let mut st: Vec<i32> = Vec::new();
              for i in 0..n {
                  while let Some(&last) = st.last() {
                      if last > nums[i] && st.len() - 1 + (n - i) >= k {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  if st.len() < k {
                      st.push(nums[i]);
                  }
              }
              st
          }
        `,
        php: code`
          function mostCompetitive($nums, $k) {
              $n = count($nums);
              $st = [];
              for ($i = 0; $i < $n; $i++) {
                  while (!empty($st) && $st[count($st) - 1] > $nums[$i] && count($st) - 1 + ($n - $i) >= $k) array_pop($st);
                  if (count($st) < $k) $st[] = $nums[$i];
              }
              return $st;
          }
        `,
        ruby: code`
          def mostCompetitive(nums, k)
            n = nums.length
            st = []
            nums.each_with_index do |x, i|
              st.pop while !st.empty? && st[-1] > x && st.length - 1 + (n - i) >= k
              st << x if st.length < k
            end
            st
          end
        `,
      },
    };
  })(),

  // ── Replace Non-Coprime Numbers in Array (LC 2197) ─────────────
  (() => {
    const LIMIT = 100000000;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    // Literal process: merge the first adjacent non-coprime pair until none is left.
    // Returns null when a value would pass 10^8 (the generator then retries smaller).
    const ref = (nums: number[]): number[] | null => {
      const a = nums.slice();
      for (;;) {
        let merged = false;
        for (let i = 0; i + 1 < a.length; i++) {
          const g = gcd(a[i], a[i + 1]);
          if (g > 1) {
            const l = (a[i] / g) * a[i + 1];
            if (l > LIMIT) return null;
            a.splice(i, 2, l);
            merged = true;
            break;
          }
        }
        if (!merged) return a;
      }
    };
    const DIVS: number[] = [];
    for (let d = 1; d <= 100000; d++) if (720720 % d === 0) DIVS.push(d);
    return {
      slug: "replace-non-coprime-numbers-in-array",
      title: "Replace Non-Coprime Numbers in Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Stack", "Number Theory", "Amazon", "Google"],
      signature: { funcName: "replaceNonCoprimes", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Two numbers are **non-coprime** when their greatest common divisor is greater than 1. Starting from `nums`, repeat the following while possible:\n\n1. Find any two **adjacent** numbers that are non-coprime.\n2. Replace the pair by a single number: their least common multiple (LCM).\n\nReturn the final array. It can be shown that the order in which pairs are merged does not change the result. The test data guarantees that every value in the final array is at most `10^8`.",
        [
          { in: "nums = [4,6,5,15,7]", out: "[60,7]", note: "4 and 6 merge into 12, 5 and 15 into 15, then 12 and 15 into 60; 60 and 7 are coprime." },
          { in: "nums = [3,3,1,1,2,4]", out: "[3,1,1,4]", note: "1 is coprime with everything, so it separates its neighbours." },
          { in: "nums = [7]", out: "[7]" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5", "The values of the final array are at most 10^8."]),
      hints: [
        "A merge can create a number that is non-coprime with what is to its left, so merges cascade backwards.",
        "Process left to right with a stack holding an already fully merged prefix.",
        "For each new value `x`, while the top of the stack shares a factor with `x`, pop it and set `x = lcm(top, x)`; then push `x`.",
      ],
      editorial: explain({
        idea: "Keep the processed prefix fully merged on a stack. A new number can only interact with the top, and every merge produces a number that may now interact with the new top — so merging continues down the stack until it meets a coprime neighbour.",
        steps: [
          "Create an empty stack.",
          "For each `x` in `nums`: while the stack is non-empty and `gcd(top, x) > 1`, pop `top` and set `x = top / gcd(top, x) * x`.",
          "Push `x`.",
          "Return the stack from bottom to top.",
        ],
        why: "Invariant: adjacent stack entries are coprime. Merging only grows the set of prime factors of a value, so an entry coprime with its neighbours could become non-coprime only through a merge involving that neighbour — which is exactly what the inner loop checks. When the loop stops, the new `x` is coprime with the top and the invariant holds again. At the end no adjacent pair is non-coprime, and since the final result does not depend on the merge order, this is the answer.",
        time: "O(n log V) — each element is pushed and popped once, with a gcd per pop",
        space: "O(n)",
        pitfalls: [
          "Checking only the incoming neighbour once misses cascades such as `[12, 5, 15]` → `[60]`.",
          "Compute the LCM as `a / gcd * b`, dividing first, so intermediate products do not overflow.",
          "1 is coprime with everything (gcd 1), including another 1.",
        ],
      }),
      examples: [
        { input: "[4,6,5,15,7]", expectedOutput: "[60,7]" },
        { input: "[3,3,1,1,2,4]", expectedOutput: "[3,1,1,4]" },
        { input: "[7]", expectedOutput: "[7]" },
      ],
      gen: (rng: Rng) => {
        const pool = ri(rng, 0, 3);
        const draw = () => {
          if (pool === 0) return ri(rng, 1, 30);
          if (pool === 1) return pick(rng, DIVS);
          if (pool === 2) {
            const p = pick(rng, [1, 2, 3, 5, 7, 11, 13, 97, 101, 9973, 99991]);
            const v = p * pick(rng, [1, 1, 2, 3]);
            return v <= 100000 ? v : p;
          }
          return ri(rng, 1, 100000);
        };
        let n = ri(rng, 1, pick(rng, [1, 8, 40]));
        for (;;) {
          const nums = Array.from({ length: n }, draw);
          const out = ref(nums);
          if (out) return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(out) };
          n = Math.max(1, Math.floor(n / 2));
        }
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def replaceNonCoprimes(nums: List[int]) -> List[int]:
              st = []
              for x in nums:
                  while st and gcd(st[-1], x) > 1:
                      top = st.pop()
                      x = top // gcd(top, x) * x
                  st.append(x)
              return st
        `,
        javascript: code`
          var replaceNonCoprimes = function(nums) {
              var gcd = function(a, b) {
                  while (b !== 0) { var t = a % b; a = b; b = t; }
                  return a;
              };
              var st = [];
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  while (st.length > 0) {
                      var g = gcd(st[st.length - 1], x);
                      if (g === 1) break;
                      x = st.pop() / g * x;
                  }
                  st.push(x);
              }
              return st;
          };
        `,
        typescript: code`
          function gcdOfTwo(a: number, b: number): number {
              while (b !== 0) { var t = a % b; a = b; b = t; }
              return a;
          }

          function replaceNonCoprimes(nums: number[]): number[] {
              var st: number[] = [];
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  while (st.length > 0) {
                      var g = gcdOfTwo(st[st.length - 1], x);
                      if (g === 1) break;
                      x = (st.pop() as number) / g * x;
                  }
                  st.push(x);
              }
              return st;
          }
        `,
        java: code`
          private static long gcdOfTwo(long a, long b) {
              while (b != 0) { long t = a % b; a = b; b = t; }
              return a;
          }

          public static int[] replaceNonCoprimes(int[] nums) {
              long[] st = new long[nums.length];
              int top = 0;
              for (int v : nums) {
                  long x = v;
                  while (top > 0) {
                      long g = gcdOfTwo(st[top - 1], x);
                      if (g == 1) break;
                      x = st[--top] / g * x;
                  }
                  st[top++] = x;
              }
              int[] res = new int[top];
              for (int i = 0; i < top; i++) res[i] = (int) st[i];
              return res;
          }
        `,
        cpp: code`
          long long gcdOfTwo(long long a, long long b) {
              while (b != 0) { long long t = a % b; a = b; b = t; }
              return a;
          }

          vector<int> replaceNonCoprimes(vector<int>& nums) {
              vector<long long> st;
              for (int v : nums) {
                  long long x = v;
                  while (!st.empty()) {
                      long long g = gcdOfTwo(st.back(), x);
                      if (g == 1) break;
                      x = st.back() / g * x;
                      st.pop_back();
                  }
                  st.push_back(x);
              }
              return vector<int>(st.begin(), st.end());
          }
        `,
        c: code`
          static long long gcdOfTwo(long long a, long long b) {
              while (b != 0) { long long t = a % b; a = b; b = t; }
              return a;
          }

          int* replaceNonCoprimes(int* nums, int numsSize, int* returnSize) {
              long long* st = (long long*)malloc(sizeof(long long) * (numsSize + 1));
              int top = 0;
              for (int i = 0; i < numsSize; i++) {
                  long long x = nums[i];
                  while (top > 0) {
                      long long g = gcdOfTwo(st[top - 1], x);
                      if (g == 1) break;
                      top--;
                      x = st[top] / g * x;
                  }
                  st[top++] = x;
              }
              int* res = (int*)malloc(sizeof(int) * (top > 0 ? top : 1));
              for (int i = 0; i < top; i++) res[i] = (int)st[i];
              free(st);
              *returnSize = top;
              return res;
          }
        `,
        csharp: code`
          private static long GcdOfTwo(long a, long b)
          {
              while (b != 0) { long t = a % b; a = b; b = t; }
              return a;
          }

          public static int[] ReplaceNonCoprimes(int[] nums)
          {
              var st = new List<long>();
              foreach (int v in nums)
              {
                  long x = v;
                  while (st.Count > 0)
                  {
                      long g = GcdOfTwo(st[st.Count - 1], x);
                      if (g == 1) break;
                      x = st[st.Count - 1] / g * x;
                      st.RemoveAt(st.Count - 1);
                  }
                  st.Add(x);
              }
              int[] res = new int[st.Count];
              for (int i = 0; i < st.Count; i++) res[i] = (int)st[i];
              return res;
          }
        `,
        go: code`
          func gcdOfTwo(a, b int64) int64 {
              for b != 0 {
                  a, b = b, a%b
              }
              return a
          }

          func replaceNonCoprimes(nums []int) []int {
              st := []int64{}
              for _, v := range nums {
                  x := int64(v)
                  for len(st) > 0 {
                      g := gcdOfTwo(st[len(st)-1], x)
                      if g == 1 {
                          break
                      }
                      x = st[len(st)-1] / g * x
                      st = st[:len(st)-1]
                  }
                  st = append(st, x)
              }
              res := make([]int, len(st))
              for i, x := range st {
                  res[i] = int(x)
              }
              return res
          }
        `,
        kotlin: code`
          fun gcdOfTwo(a0: Long, b0: Long): Long {
              var a = a0
              var b = b0
              while (b != 0L) {
                  val t = a % b
                  a = b
                  b = t
              }
              return a
          }

          fun replaceNonCoprimes(nums: IntArray): IntArray {
              val st = LongArray(nums.size)
              var top = 0
              for (v in nums) {
                  var x = v.toLong()
                  while (top > 0) {
                      val g = gcdOfTwo(st[top - 1], x)
                      if (g == 1L) break
                      top--
                      x = st[top] / g * x
                  }
                  st[top++] = x
              }
              return IntArray(top) { st[it].toInt() }
          }
        `,
        swift: code`
          func gcdOfTwo(_ a0: Int, _ b0: Int) -> Int {
              var a = a0
              var b = b0
              while b != 0 {
                  let t = a % b
                  a = b
                  b = t
              }
              return a
          }

          func replaceNonCoprimes(_ nums: [Int]) -> [Int] {
              var st = [Int]()
              for v in nums {
                  var x = v
                  while let top = st.last {
                      let g = gcdOfTwo(top, x)
                      if g == 1 { break }
                      x = top / g * x
                      st.removeLast()
                  }
                  st.append(x)
              }
              return st
          }
        `,
        rust: code`
          fn gcd_of_two(a: i64, b: i64) -> i64 {
              let mut a = a;
              let mut b = b;
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              a
          }

          fn replaceNonCoprimes(nums: Vec<i32>) -> Vec<i32> {
              let mut st: Vec<i64> = Vec::new();
              for &v in nums.iter() {
                  let mut x = v as i64;
                  while let Some(&top) = st.last() {
                      let g = gcd_of_two(top, x);
                      if g == 1 {
                          break;
                      }
                      x = top / g * x;
                      st.pop();
                  }
                  st.push(x);
              }
              st.iter().map(|&x| x as i32).collect()
          }
        `,
        php: code`
          function gcdOfTwo($a, $b) {
              while ($b != 0) {
                  $t = $a % $b;
                  $a = $b;
                  $b = $t;
              }
              return $a;
          }

          function replaceNonCoprimes($nums) {
              $st = [];
              foreach ($nums as $x) {
                  while (!empty($st)) {
                      $top = $st[count($st) - 1];
                      $g = gcdOfTwo($top, $x);
                      if ($g == 1) break;
                      $x = intdiv($top, $g) * $x;
                      array_pop($st);
                  }
                  $st[] = $x;
              }
              return $st;
          }
        `,
        ruby: code`
          def replaceNonCoprimes(nums)
            st = []
            nums.each do |v|
              x = v
              while !st.empty? && st[-1].gcd(x) > 1
                x = st.pop.lcm(x)
              end
              st << x
            end
            st
          end
        `,
      },
    };
  })(),

  // ── Max Chunks To Make Sorted II (LC 768) ──────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const sorted = arr.slice().sort((a, b) => a - b);
      const diff = new Map<number, number>();
      let nonzero = 0;
      const bump = (v: number, d: number) => {
        const before = diff.get(v) || 0;
        const after = before + d;
        if (before === 0) nonzero++;
        if (after === 0) nonzero--;
        diff.set(v, after);
      };
      let chunks = 0;
      for (let i = 0; i < arr.length; i++) {
        bump(arr[i], 1);
        bump(sorted[i], -1);
        if (nonzero === 0) chunks++;
      }
      return chunks;
    };
    return {
      slug: "max-chunks-to-make-sorted-ii",
      title: "Max Chunks To Make Sorted II",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Greedy", "Monotonic Stack", "Google", "Amazon"],
      signature: { funcName: "maxChunksToSorted", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Split the integer array `arr` into contiguous **chunks**, sort each chunk on its own, and put the chunks back together in their original order. The split is valid if the result equals `arr` sorted in non-decreasing order.\n\nValues may repeat. Return the largest number of chunks a valid split can have.",
        [
          { in: "arr = [3,2,4,4,6,5]", out: "4", note: "`[3,2] [4] [4] [6,5]` sorts to `[2,3,4,4,5,6]`." },
          { in: "arr = [5,1,1,8,2]", out: "1", note: "The final 2 must move in front of the 5, so everything is one chunk." },
          { in: "arr = [1,1,0,0,1]", out: "2", note: "`[1,1,0,0] [1]`." },
        ],
        ["1 <= arr.length <= 2000", "0 <= arr[i] <= 10^8"]),
      hints: [
        "A cut after position `i` is allowed exactly when everything to its left is `<=` everything to its right.",
        "Represent each chunk by its maximum and keep the chunks on a stack. What happens when a value smaller than some chunk maxima arrives?",
        "If the new value `x` is smaller than the top chunk's maximum, it must join that chunk — and every earlier chunk whose maximum is greater than `x`. Pop them all and push back the largest maximum.",
      ],
      editorial: explain({
        idea: "Maintain the current best partition of the prefix as a stack of chunk maxima (non-decreasing from bottom to top). A new value either starts a chunk of its own or forces the chunks with larger maxima to fuse with it.",
        steps: [
          "For each `x` in `arr`: if the stack is empty or `x >= top`, push `x` — it can be a chunk on its own.",
          "Otherwise remember `mx = top` (the largest maximum so far), pop it, and keep popping while the new top is `> x`.",
          "Push `mx` back: the fused chunk's maximum.",
          "The answer is the stack size.",
        ],
        why: "A value `x` must end up before every value greater than it, so it cannot be separated from any earlier chunk whose maximum exceeds `x`; those chunks are contiguous at the top of the stack because the maxima are non-decreasing. Chunks whose maximum is `<= x` can stay separate, since `x` (and everything in its chunk so far) is not smaller than anything in them. Merging only what is forced keeps the number of chunks as large as possible.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Duplicates break the 'Max Chunks I' trick of comparing with indices — compare values instead.",
          "Pop only while the top is strictly greater than `x`; equal maxima can stay apart.",
          "Push back the largest popped maximum, not `x`.",
        ],
      }),
      examples: [
        { input: "[3,2,4,4,6,5]", expectedOutput: "4" },
        { input: "[5,1,1,8,2]", expectedOutput: "1" },
        { input: "[1,1,0,0,1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 50);
        const hi = pick(rng, [2, 10, 100000000]);
        const arr = Array.from({ length: n }, () => ri(rng, 0, hi));
        const shape = ri(rng, 0, 5);
        if (shape <= 1) {
          arr.sort((a, b) => a - b);
          if (shape === 1) {
            const swaps = ri(rng, 1, 3);
            for (let s = 0; s < swaps; s++) {
              const i = ri(rng, 0, n - 1), j = ri(rng, 0, n - 1);
              const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
            }
          }
        } else if (shape === 2) arr.sort((a, b) => b - a);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxChunksToSorted(arr: List[int]) -> int:
              st = []
              for x in arr:
                  if not st or x >= st[-1]:
                      st.append(x)
                  else:
                      mx = st.pop()
                      while st and st[-1] > x:
                          st.pop()
                      st.append(mx)
              return len(st)
        `,
        javascript: code`
          var maxChunksToSorted = function(arr) {
              var st = [];
              for (var i = 0; i < arr.length; i++) {
                  var x = arr[i];
                  if (st.length === 0 || x >= st[st.length - 1]) {
                      st.push(x);
                  } else {
                      var mx = st.pop();
                      while (st.length > 0 && st[st.length - 1] > x) st.pop();
                      st.push(mx);
                  }
              }
              return st.length;
          };
        `,
        typescript: code`
          function maxChunksToSorted(arr: number[]): number {
              var st: number[] = [];
              for (var i = 0; i < arr.length; i++) {
                  var x = arr[i];
                  if (st.length === 0 || x >= st[st.length - 1]) {
                      st.push(x);
                  } else {
                      var mx = st.pop() as number;
                      while (st.length > 0 && st[st.length - 1] > x) st.pop();
                      st.push(mx);
                  }
              }
              return st.length;
          }
        `,
        java: code`
          public static int maxChunksToSorted(int[] arr) {
              int[] st = new int[arr.length];
              int top = 0;
              for (int x : arr) {
                  if (top == 0 || x >= st[top - 1]) {
                      st[top++] = x;
                  } else {
                      int mx = st[--top];
                      while (top > 0 && st[top - 1] > x) top--;
                      st[top++] = mx;
                  }
              }
              return top;
          }
        `,
        cpp: code`
          int maxChunksToSorted(vector<int>& arr) {
              vector<int> st;
              for (int x : arr) {
                  if (st.empty() || x >= st.back()) {
                      st.push_back(x);
                  } else {
                      int mx = st.back();
                      st.pop_back();
                      while (!st.empty() && st.back() > x) st.pop_back();
                      st.push_back(mx);
                  }
              }
              return st.size();
          }
        `,
        c: code`
          int maxChunksToSorted(int* arr, int arrSize) {
              int* st = (int*)malloc(sizeof(int) * (arrSize + 1));
              int top = 0;
              for (int i = 0; i < arrSize; i++) {
                  int x = arr[i];
                  if (top == 0 || x >= st[top - 1]) {
                      st[top++] = x;
                  } else {
                      int mx = st[--top];
                      while (top > 0 && st[top - 1] > x) top--;
                      st[top++] = mx;
                  }
              }
              free(st);
              return top;
          }
        `,
        csharp: code`
          public static int MaxChunksToSorted(int[] arr)
          {
              int[] st = new int[arr.Length];
              int top = 0;
              foreach (int x in arr)
              {
                  if (top == 0 || x >= st[top - 1])
                  {
                      st[top++] = x;
                  }
                  else
                  {
                      int mx = st[--top];
                      while (top > 0 && st[top - 1] > x) top--;
                      st[top++] = mx;
                  }
              }
              return top;
          }
        `,
        go: code`
          func maxChunksToSorted(arr []int) int {
              st := []int{}
              for _, x := range arr {
                  if len(st) == 0 || x >= st[len(st)-1] {
                      st = append(st, x)
                  } else {
                      mx := st[len(st)-1]
                      st = st[:len(st)-1]
                      for len(st) > 0 && st[len(st)-1] > x {
                          st = st[:len(st)-1]
                      }
                      st = append(st, mx)
                  }
              }
              return len(st)
          }
        `,
        kotlin: code`
          fun maxChunksToSorted(arr: IntArray): Int {
              val st = IntArray(arr.size)
              var top = 0
              for (x in arr) {
                  if (top == 0 || x >= st[top - 1]) {
                      st[top++] = x
                  } else {
                      top--
                      val mx = st[top]
                      while (top > 0 && st[top - 1] > x) top--
                      st[top++] = mx
                  }
              }
              return top
          }
        `,
        swift: code`
          func maxChunksToSorted(_ arr: [Int]) -> Int {
              var st = [Int]()
              for x in arr {
                  if st.isEmpty || x >= st[st.count - 1] {
                      st.append(x)
                  } else {
                      let mx = st.removeLast()
                      while let last = st.last, last > x { st.removeLast() }
                      st.append(mx)
                  }
              }
              return st.count
          }
        `,
        rust: code`
          fn maxChunksToSorted(arr: Vec<i32>) -> i32 {
              let mut st: Vec<i32> = Vec::new();
              for &x in arr.iter() {
                  let push_alone = match st.last() {
                      None => true,
                      Some(&top) => x >= top,
                  };
                  if push_alone {
                      st.push(x);
                  } else {
                      let mx = st.pop().unwrap();
                      while let Some(&top) = st.last() {
                          if top > x {
                              st.pop();
                          } else {
                              break;
                          }
                      }
                      st.push(mx);
                  }
              }
              st.len() as i32
          }
        `,
        php: code`
          function maxChunksToSorted($arr) {
              $st = [];
              foreach ($arr as $x) {
                  if (empty($st) || $x >= $st[count($st) - 1]) {
                      $st[] = $x;
                  } else {
                      $mx = array_pop($st);
                      while (!empty($st) && $st[count($st) - 1] > $x) array_pop($st);
                      $st[] = $mx;
                  }
              }
              return count($st);
          }
        `,
        ruby: code`
          def maxChunksToSorted(arr)
            st = []
            arr.each do |x|
              if st.empty? || x >= st[-1]
                st << x
              else
                mx = st.pop
                st.pop while !st.empty? && st[-1] > x
                st << mx
              end
            end
            st.length
          end
        `,
      },
    };
  })(),

  // ── Beautiful Towers II (LC 2866) ──────────────────────────────
  (() => {
    const ref = (a: number[]) => {
      let best = 0;
      for (let i = 0; i < a.length; i++) {
        let sum = a[i], cur = a[i];
        for (let j = i - 1; j >= 0; j--) { cur = Math.min(cur, a[j]); sum += cur; }
        cur = a[i];
        for (let j = i + 1; j < a.length; j++) { cur = Math.min(cur, a[j]); sum += cur; }
        best = Math.max(best, sum);
      }
      return best;
    };
    return {
      slug: "beautiful-towers-ii",
      title: "Beautiful Towers II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Google"],
      signature: { funcName: "maximumSumOfHeights", params: [{ name: "maxHeights", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You will build `n` towers in a row; tower `i` must get a height `heights[i]` with `1 <= heights[i] <= maxHeights[i]`.\n\nThe arrangement is **beautiful** when the heights form a mountain: there is a peak index `p` such that heights never decrease from index `0` up to `p`, and never increase from `p` to index `n - 1` (either side may be empty).\n\nReturn the largest possible **sum** of heights of a beautiful arrangement.\n\n(The height bound below is tighter than the original problem's so that the answer fits in a 32-bit integer.)",
        [
          { in: "maxHeights = [4,6,2,7,3]", out: "16", note: "Peak at index 1: `[4,6,2,2,2]`; a peak at index 3 (`[2,2,2,7,3]`) also gives 16." },
          { in: "maxHeights = [3,3,3]", out: "9" },
          { in: "maxHeights = [1,5,1]", out: "7" },
        ],
        ["1 <= maxHeights.length <= 10^5", "1 <= maxHeights[i] <= 2 * 10^4"]),
      hints: [
        "Once the peak `p` is fixed, the best choice is greedy: `heights[p] = maxHeights[p]`, and walking away from the peak each tower takes the running minimum of the limits.",
        "So the left part contributes `Σ min(maxHeights[j..p])` for `j <= p`. Can you compute that for every `p` at once?",
        "With `q` the previous index whose limit is smaller than `maxHeights[p]`, `left[p] = left[q] + maxHeights[p] × (p - q)` — a monotonic stack finds `q`. Do the same from the right and maximise `left[p] + right[p] - maxHeights[p]`.",
      ],
      editorial: explain({
        idea: "For a fixed peak the optimal mountain takes running minimums outward. The left and right totals for every possible peak satisfy a simple recurrence over the previous smaller element, so two monotonic-stack sweeps price all peaks in linear time.",
        steps: [
          "Left sweep: keep a stack of indices with strictly increasing limits. For `i`, pop while the top limit is `>= maxHeights[i]`; with `q` the remaining top (or -1), set `left[i] = (q >= 0 ? left[q] : 0) + maxHeights[i] × (i - q)`.",
          "Right sweep: the mirror image, giving `right[i]` = best total of the non-increasing part starting at `i`.",
          "The best mountain with peak `i` sums to `left[i] + right[i] - maxHeights[i]` (the peak is counted twice).",
          "Return the maximum over all `i`, using 64-bit sums along the way.",
        ],
        why: "With peak `p`, tower `j < p` can be no taller than any limit between `j` and `p`, and taking exactly that minimum is feasible and best, so the left total is `Σ_{j<=p} min(maxHeights[j..p])`. For indices `j` in `(q, p]` that minimum is `maxHeights[p]` itself, and for `j <= q` it equals the minimum over `[j, q]`, because `maxHeights[q]` is smaller than everything in `(q, p]` — which is exactly `left[q]`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Trying every peak with an O(n) walk is O(n²).",
          "Subtract the peak once: both sweeps include it.",
          "Intermediate totals can exceed 32 bits in the original constraints; keep 64-bit sums.",
        ],
      }),
      examples: [
        { input: "[4,6,2,7,3]", expectedOutput: "16" },
        { input: "[3,3,3]", expectedOutput: "9" },
        { input: "[1,5,1]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 30, 20000]);
        const a = Array.from({ length: n }, () => ri(rng, 1, hi));
        const shape = ri(rng, 0, 6);
        if (shape === 0) a.sort((x, y) => x - y);
        else if (shape === 1) a.sort((x, y) => y - x);
        return { input: fmtIntArr(a), expectedOutput: String(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumSumOfHeights(maxHeights: List[int]) -> int:
              a = maxHeights
              n = len(a)
              left = [0] * n
              st = []
              for i in range(n):
                  while st and a[st[-1]] >= a[i]:
                      st.pop()
                  q = st[-1] if st else -1
                  left[i] = (left[q] if q >= 0 else 0) + a[i] * (i - q)
                  st.append(i)
              right = [0] * n
              st = []
              for i in range(n - 1, -1, -1):
                  while st and a[st[-1]] >= a[i]:
                      st.pop()
                  q = st[-1] if st else n
                  right[i] = (right[q] if q < n else 0) + a[i] * (q - i)
                  st.append(i)
              return max(left[i] + right[i] - a[i] for i in range(n))
        `,
        javascript: code`
          var maximumSumOfHeights = function(maxHeights) {
              var a = maxHeights, n = a.length;
              var left = new Array(n).fill(0), right = new Array(n).fill(0);
              var st = [];
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && a[st[st.length - 1]] >= a[i]) st.pop();
                  var q = st.length > 0 ? st[st.length - 1] : -1;
                  left[i] = (q >= 0 ? left[q] : 0) + a[i] * (i - q);
                  st.push(i);
              }
              st = [];
              for (var j = n - 1; j >= 0; j--) {
                  while (st.length > 0 && a[st[st.length - 1]] >= a[j]) st.pop();
                  var r = st.length > 0 ? st[st.length - 1] : n;
                  right[j] = (r < n ? right[r] : 0) + a[j] * (r - j);
                  st.push(j);
              }
              var best = 0;
              for (var k = 0; k < n; k++) best = Math.max(best, left[k] + right[k] - a[k]);
              return best;
          };
        `,
        typescript: code`
          function maximumSumOfHeights(maxHeights: number[]): number {
              var a = maxHeights, n = a.length;
              var left: number[] = [], right: number[] = [];
              for (var z = 0; z < n; z++) { left.push(0); right.push(0); }
              var st: number[] = [];
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && a[st[st.length - 1]] >= a[i]) st.pop();
                  var q = st.length > 0 ? st[st.length - 1] : -1;
                  left[i] = (q >= 0 ? left[q] : 0) + a[i] * (i - q);
                  st.push(i);
              }
              st = [];
              for (var j = n - 1; j >= 0; j--) {
                  while (st.length > 0 && a[st[st.length - 1]] >= a[j]) st.pop();
                  var r = st.length > 0 ? st[st.length - 1] : n;
                  right[j] = (r < n ? right[r] : 0) + a[j] * (r - j);
                  st.push(j);
              }
              var best = 0;
              for (var k = 0; k < n; k++) best = Math.max(best, left[k] + right[k] - a[k]);
              return best;
          }
        `,
        java: code`
          public static int maximumSumOfHeights(int[] maxHeights) {
              int[] a = maxHeights;
              int n = a.length;
              long[] left = new long[n], right = new long[n];
              int[] st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--;
                  int q = top > 0 ? st[top - 1] : -1;
                  left[i] = (q >= 0 ? left[q] : 0) + (long) a[i] * (i - q);
                  st[top++] = i;
              }
              top = 0;
              for (int i = n - 1; i >= 0; i--) {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--;
                  int q = top > 0 ? st[top - 1] : n;
                  right[i] = (q < n ? right[q] : 0) + (long) a[i] * (q - i);
                  st[top++] = i;
              }
              long best = 0;
              for (int i = 0; i < n; i++) best = Math.max(best, left[i] + right[i] - a[i]);
              return (int) best;
          }
        `,
        cpp: code`
          int maximumSumOfHeights(vector<int>& maxHeights) {
              vector<int>& a = maxHeights;
              int n = a.size();
              vector<long long> left(n, 0), right(n, 0);
              vector<int> st;
              for (int i = 0; i < n; i++) {
                  while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
                  int q = st.empty() ? -1 : st.back();
                  left[i] = (q >= 0 ? left[q] : 0) + (long long)a[i] * (i - q);
                  st.push_back(i);
              }
              st.clear();
              for (int i = n - 1; i >= 0; i--) {
                  while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
                  int q = st.empty() ? n : st.back();
                  right[i] = (q < n ? right[q] : 0) + (long long)a[i] * (q - i);
                  st.push_back(i);
              }
              long long best = 0;
              for (int i = 0; i < n; i++) best = max(best, left[i] + right[i] - a[i]);
              return (int)best;
          }
        `,
        c: code`
          int maximumSumOfHeights(int* maxHeights, int maxHeightsSize) {
              int* a = maxHeights;
              int n = maxHeightsSize;
              long long* left = (long long*)malloc(sizeof(long long) * (n + 1));
              long long* right = (long long*)malloc(sizeof(long long) * (n + 1));
              int* st = (int*)malloc(sizeof(int) * (n + 1));
              int top = 0;
              for (int i = 0; i < n; i++) {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--;
                  int q = top > 0 ? st[top - 1] : -1;
                  left[i] = (q >= 0 ? left[q] : 0) + (long long)a[i] * (i - q);
                  st[top++] = i;
              }
              top = 0;
              for (int i = n - 1; i >= 0; i--) {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--;
                  int q = top > 0 ? st[top - 1] : n;
                  right[i] = (q < n ? right[q] : 0) + (long long)a[i] * (q - i);
                  st[top++] = i;
              }
              long long best = 0;
              for (int i = 0; i < n; i++) {
                  long long total = left[i] + right[i] - a[i];
                  if (total > best) best = total;
              }
              free(left);
              free(right);
              free(st);
              return (int)best;
          }
        `,
        csharp: code`
          public static int MaximumSumOfHeights(int[] maxHeights)
          {
              int[] a = maxHeights;
              int n = a.Length;
              long[] left = new long[n], right = new long[n];
              int[] st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--;
                  int q = top > 0 ? st[top - 1] : -1;
                  left[i] = (q >= 0 ? left[q] : 0) + (long)a[i] * (i - q);
                  st[top++] = i;
              }
              top = 0;
              for (int i = n - 1; i >= 0; i--)
              {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--;
                  int q = top > 0 ? st[top - 1] : n;
                  right[i] = (q < n ? right[q] : 0) + (long)a[i] * (q - i);
                  st[top++] = i;
              }
              long best = 0;
              for (int i = 0; i < n; i++) best = Math.Max(best, left[i] + right[i] - a[i]);
              return (int)best;
          }
        `,
        go: code`
          func maximumSumOfHeights(maxHeights []int) int {
              a := maxHeights
              n := len(a)
              left := make([]int64, n)
              right := make([]int64, n)
              st := []int{}
              for i := 0; i < n; i++ {
                  for len(st) > 0 && a[st[len(st)-1]] >= a[i] {
                      st = st[:len(st)-1]
                  }
                  q := -1
                  if len(st) > 0 {
                      q = st[len(st)-1]
                  }
                  left[i] = int64(a[i]) * int64(i-q)
                  if q >= 0 {
                      left[i] += left[q]
                  }
                  st = append(st, i)
              }
              st = st[:0]
              for i := n - 1; i >= 0; i-- {
                  for len(st) > 0 && a[st[len(st)-1]] >= a[i] {
                      st = st[:len(st)-1]
                  }
                  q := n
                  if len(st) > 0 {
                      q = st[len(st)-1]
                  }
                  right[i] = int64(a[i]) * int64(q-i)
                  if q < n {
                      right[i] += right[q]
                  }
                  st = append(st, i)
              }
              var best int64
              for i := 0; i < n; i++ {
                  total := left[i] + right[i] - int64(a[i])
                  if total > best {
                      best = total
                  }
              }
              return int(best)
          }
        `,
        kotlin: code`
          fun maximumSumOfHeights(maxHeights: IntArray): Int {
              val a = maxHeights
              val n = a.size
              val left = LongArray(n)
              val right = LongArray(n)
              val st = IntArray(n)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--
                  val q = if (top > 0) st[top - 1] else -1
                  left[i] = (if (q >= 0) left[q] else 0L) + a[i].toLong() * (i - q)
                  st[top++] = i
              }
              top = 0
              for (i in n - 1 downTo 0) {
                  while (top > 0 && a[st[top - 1]] >= a[i]) top--
                  val q = if (top > 0) st[top - 1] else n
                  right[i] = (if (q < n) right[q] else 0L) + a[i].toLong() * (q - i)
                  st[top++] = i
              }
              var best = 0L
              for (i in 0 until n) best = maxOf(best, left[i] + right[i] - a[i])
              return best.toInt()
          }
        `,
        swift: code`
          func maximumSumOfHeights(_ maxHeights: [Int]) -> Int {
              let a = maxHeights
              let n = a.count
              var left = [Int](repeating: 0, count: n)
              var right = [Int](repeating: 0, count: n)
              var st = [Int]()
              for i in 0..<n {
                  while let top = st.last, a[top] >= a[i] { st.removeLast() }
                  let q = st.last ?? -1
                  left[i] = (q >= 0 ? left[q] : 0) + a[i] * (i - q)
                  st.append(i)
              }
              st.removeAll()
              for i in stride(from: n - 1, through: 0, by: -1) {
                  while let top = st.last, a[top] >= a[i] { st.removeLast() }
                  let q = st.last ?? n
                  right[i] = (q < n ? right[q] : 0) + a[i] * (q - i)
                  st.append(i)
              }
              var best = 0
              for i in 0..<n { best = max(best, left[i] + right[i] - a[i]) }
              return best
          }
        `,
        rust: code`
          fn maximumSumOfHeights(maxHeights: Vec<i32>) -> i32 {
              let a: Vec<i64> = maxHeights.iter().map(|&x| x as i64).collect();
              let n = a.len();
              let mut left = vec![0i64; n];
              let mut right = vec![0i64; n];
              let mut st: Vec<usize> = Vec::new();
              for i in 0..n {
                  while let Some(&top) = st.last() {
                      if a[top] >= a[i] {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  left[i] = match st.last() {
                      Some(&q) => left[q] + a[i] * (i - q) as i64,
                      None => a[i] * (i + 1) as i64,
                  };
                  st.push(i);
              }
              st.clear();
              for i in (0..n).rev() {
                  while let Some(&top) = st.last() {
                      if a[top] >= a[i] {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  right[i] = match st.last() {
                      Some(&q) => right[q] + a[i] * (q - i) as i64,
                      None => a[i] * (n - i) as i64,
                  };
                  st.push(i);
              }
              let mut best: i64 = 0;
              for i in 0..n {
                  let total = left[i] + right[i] - a[i];
                  if total > best {
                      best = total;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function maximumSumOfHeights($maxHeights) {
              $a = $maxHeights;
              $n = count($a);
              $left = array_fill(0, $n, 0);
              $right = array_fill(0, $n, 0);
              $st = [];
              for ($i = 0; $i < $n; $i++) {
                  while (!empty($st) && $a[$st[count($st) - 1]] >= $a[$i]) array_pop($st);
                  $q = empty($st) ? -1 : $st[count($st) - 1];
                  $left[$i] = ($q >= 0 ? $left[$q] : 0) + $a[$i] * ($i - $q);
                  $st[] = $i;
              }
              $st = [];
              for ($i = $n - 1; $i >= 0; $i--) {
                  while (!empty($st) && $a[$st[count($st) - 1]] >= $a[$i]) array_pop($st);
                  $q = empty($st) ? $n : $st[count($st) - 1];
                  $right[$i] = ($q < $n ? $right[$q] : 0) + $a[$i] * ($q - $i);
                  $st[] = $i;
              }
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  $total = $left[$i] + $right[$i] - $a[$i];
                  if ($total > $best) $best = $total;
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumSumOfHeights(maxHeights)
            a = maxHeights
            n = a.length
            left = Array.new(n, 0)
            right = Array.new(n, 0)
            st = []
            n.times do |i|
              st.pop while !st.empty? && a[st[-1]] >= a[i]
              q = st.empty? ? -1 : st[-1]
              left[i] = (q >= 0 ? left[q] : 0) + a[i] * (i - q)
              st << i
            end
            st = []
            (n - 1).downto(0) do |i|
              st.pop while !st.empty? && a[st[-1]] >= a[i]
              q = st.empty? ? n : st[-1]
              right[i] = (q < n ? right[q] : 0) + a[i] * (q - i)
              st << i
            end
            (0...n).map { |i| left[i] + right[i] - a[i] }.max
          end
        `,
      },
    };
  })(),

  // ── Robot Collisions (LC 2751) ─────────────────────────────────
  (() => {
    // Resolve the first adjacent right-mover/left-mover pair (in position
    // order) until none is left; such pairs are disjoint, so order is irrelevant.
    const ref = (positions: number[], healths: number[], directions: string) => {
      const order = positions.map((_, i) => i).sort((a, b) => positions[a] - positions[b]);
      const h = healths.slice();
      let alive = order.slice();
      for (;;) {
        let k = -1;
        for (let t = 0; t + 1 < alive.length; t++) {
          if (directions[alive[t]] === "R" && directions[alive[t + 1]] === "L") { k = t; break; }
        }
        if (k < 0) break;
        const a = alive[k], b = alive[k + 1];
        if (h[a] === h[b]) { h[a] = 0; h[b] = 0; }
        else if (h[a] > h[b]) { h[a]--; h[b] = 0; }
        else { h[b]--; h[a] = 0; }
        alive = alive.filter((i) => h[i] > 0);
      }
      return h.filter((x) => x > 0);
    };
    return {
      slug: "robot-collisions",
      title: "Robot Collisions",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Sorting", "Simulation", "Google", "Amazon", "Meta"],
      signature: {
        funcName: "survivedRobotsHealths",
        params: [
          { name: "positions", type: "int[]" as const },
          { name: "healths", type: "int[]" as const },
          { name: "directions", type: "string" as const },
        ],
        returns: "int[]" as const,
      },
      description: describe(
        "There are `n` robots on a line, numbered `0` to `n - 1`. Robot `i` starts at `positions[i]` (all positions are distinct), has health `healths[i]`, and moves at the same constant speed in direction `directions[i]` — `'L'` for left or `'R'` for right. All robots start moving at the same moment.\n\nWhen two robots meet, they collide: the one with the **lower** health is destroyed and the other loses 1 health and keeps moving in its direction. If both have the same health, both are destroyed.\n\nReturn the healths of the robots that survive once no more collisions can happen, listed in the order of their original indices (robot 0 first). Return an empty array if none survive.",
        [
          { in: "positions = [2,8,5], healths = [4,7,3], directions = \"RLR\"", out: "[5]", note: "Robot 2 (at 5, moving right) meets robot 1 first and is destroyed; robot 1 drops to 6, then destroys robot 0 and ends with 5." },
          { in: "positions = [1,4], healths = [9,9], directions = \"RL\"", out: "[]" },
          { in: "positions = [10,3,7], healths = [5,6,2], directions = \"LLR\"", out: "[4,6]", note: "Robot 2 crashes into robot 0, which survives with 4; robot 1 drives off to the left untouched." },
        ],
        [
          "1 <= positions.length == healths.length == directions.length <= 10^5",
          "1 <= positions[i], healths[i] <= 10^9",
          "directions[i] is 'L' or 'R'",
          "All values in positions are distinct.",
        ]),
      hints: [
        "Only a right-mover with a left-mover somewhere to its right can ever collide. Process the robots from left to right in position order.",
        "Right-movers wait on a stack. A left-mover crashes into the nearest waiting right-mover first — the top of the stack.",
        "Resolve the fight at the top repeatedly: the loser leaves (pop the stack or stop the left-mover), the winner loses 1 health, and continue while the left-mover is alive and the stack is non-empty.",
      ],
      editorial: explain({
        idea: "This is asteroid collision with health. Sorted by position, a left-moving robot meets the right-moving robots to its left from nearest to farthest — exactly the order of a stack.",
        steps: [
          "Sort robot indices by position; copy the healths so they can be decreased.",
          "Scan in position order. Push every right-mover onto a stack.",
          "For a left-mover `i`, while it is alive and the stack is non-empty, fight the top `j`: if `h[j] < h[i]`, destroy `j` (pop) and decrement `h[i]`; if `h[j] > h[i]`, destroy `i` and decrement `h[j]`; if equal, destroy both.",
          "Finally list the positive healths in original index order.",
        ],
        why: "Between a right-mover `j` on the stack and a left-mover `i`, every robot that was ever between them has already been destroyed (otherwise `j` would not be on top), so `i` and `j` are the next pair to meet. Collisions of disjoint pairs do not interact, so resolving them in this order produces the same survivors as the real timeline. A surviving left-mover with an empty stack escapes, and right-movers left on the stack never meet anything.",
        time: "O(n log n) for the sort; the stack phase is O(n)",
        space: "O(n)",
        pitfalls: [
          "The input is not sorted by position — sort indices, but report in the original order.",
          "A winning robot loses exactly 1 health per collision, not the loser's health.",
          "Equal healths destroy both robots; make sure the left-mover stops fighting then.",
        ],
      }),
      examples: [
        { input: "[2,8,5]\n[4,7,3]\n\"RLR\"", expectedOutput: "[5]" },
        { input: "[1,4]\n[9,9]\n\"RL\"", expectedOutput: "[]" },
        { input: "[10,3,7]\n[5,6,2]\n\"LLR\"", expectedOutput: "[4,6]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 8 : 40);
        const span = pick(rng, [3 * n, 1000000000]);
        const used = new Set<number>();
        const positions: number[] = [];
        while (positions.length < n) {
          const p = ri(rng, 1, span);
          if (!used.has(p)) { used.add(p); positions.push(p); }
        }
        const hiH = pick(rng, [3, 20, 1000000000]);
        const healths = Array.from({ length: n }, () => ri(rng, 1, hiH));
        const pR = pick(rng, [0, 0.5, 0.5, 1]);
        let directions = "";
        for (let i = 0; i < n; i++) directions += rng() < pR ? "R" : "L";
        return {
          input: `${fmtIntArr(positions)}\n${fmtIntArr(healths)}\n"${directions}"`,
          expectedOutput: fmtIntArr(ref(positions, healths, directions)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def survivedRobotsHealths(positions: List[int], healths: List[int], directions: str) -> List[int]:
              n = len(positions)
              h = list(healths)
              order = sorted(range(n), key=lambda i: positions[i])
              st = []
              for i in order:
                  if directions[i] == 'R':
                      st.append(i)
                      continue
                  while st and h[i] > 0:
                      j = st[-1]
                      if h[j] < h[i]:
                          h[j] = 0
                          st.pop()
                          h[i] -= 1
                      elif h[j] > h[i]:
                          h[j] -= 1
                          h[i] = 0
                      else:
                          h[j] = 0
                          h[i] = 0
                          st.pop()
              return [x for x in h if x > 0]
        `,
        javascript: code`
          var survivedRobotsHealths = function(positions, healths, directions) {
              var n = positions.length;
              var h = healths.slice();
              var order = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return positions[a] - positions[b]; });
              var st = [];
              for (var k = 0; k < n; k++) {
                  var cur = order[k];
                  if (directions[cur] === "R") { st.push(cur); continue; }
                  while (st.length > 0 && h[cur] > 0) {
                      var j = st[st.length - 1];
                      if (h[j] < h[cur]) { h[j] = 0; st.pop(); h[cur]--; }
                      else if (h[j] > h[cur]) { h[j]--; h[cur] = 0; }
                      else { h[j] = 0; h[cur] = 0; st.pop(); }
                  }
              }
              var res = [];
              for (var t = 0; t < n; t++) if (h[t] > 0) res.push(h[t]);
              return res;
          };
        `,
        typescript: code`
          function survivedRobotsHealths(positions: number[], healths: number[], directions: string): number[] {
              var n = positions.length;
              var h = healths.slice();
              var order: number[] = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return positions[a] - positions[b]; });
              var st: number[] = [];
              for (var k = 0; k < n; k++) {
                  var cur = order[k];
                  if (directions.charAt(cur) === "R") { st.push(cur); continue; }
                  while (st.length > 0 && h[cur] > 0) {
                      var j = st[st.length - 1];
                      if (h[j] < h[cur]) { h[j] = 0; st.pop(); h[cur]--; }
                      else if (h[j] > h[cur]) { h[j]--; h[cur] = 0; }
                      else { h[j] = 0; h[cur] = 0; st.pop(); }
                  }
              }
              var res: number[] = [];
              for (var t = 0; t < n; t++) if (h[t] > 0) res.push(h[t]);
              return res;
          }
        `,
        java: code`
          public static int[] survivedRobotsHealths(int[] positions, int[] healths, String directions) {
              int n = positions.length;
              int[] h = healths.clone();
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> Integer.compare(positions[a], positions[b]));
              int[] st = new int[n];
              int top = 0;
              for (int k = 0; k < n; k++) {
                  int cur = order[k];
                  if (directions.charAt(cur) == 'R') { st[top++] = cur; continue; }
                  while (top > 0 && h[cur] > 0) {
                      int j = st[top - 1];
                      if (h[j] < h[cur]) { h[j] = 0; top--; h[cur]--; }
                      else if (h[j] > h[cur]) { h[j]--; h[cur] = 0; }
                      else { h[j] = 0; h[cur] = 0; top--; }
                  }
              }
              int cnt = 0;
              for (int x : h) if (x > 0) cnt++;
              int[] res = new int[cnt];
              int p = 0;
              for (int x : h) if (x > 0) res[p++] = x;
              return res;
          }
        `,
        cpp: code`
          vector<int> survivedRobotsHealths(vector<int>& positions, vector<int>& healths, string directions) {
              int n = positions.size();
              vector<int> h = healths;
              vector<int> order(n);
              for (int i = 0; i < n; i++) order[i] = i;
              sort(order.begin(), order.end(), [&](int a, int b) { return positions[a] < positions[b]; });
              vector<int> st;
              for (int cur : order) {
                  if (directions[cur] == 'R') { st.push_back(cur); continue; }
                  while (!st.empty() && h[cur] > 0) {
                      int j = st.back();
                      if (h[j] < h[cur]) { h[j] = 0; st.pop_back(); h[cur]--; }
                      else if (h[j] > h[cur]) { h[j]--; h[cur] = 0; }
                      else { h[j] = 0; h[cur] = 0; st.pop_back(); }
                  }
              }
              vector<int> res;
              for (int x : h) if (x > 0) res.push_back(x);
              return res;
          }
        `,
        c: code`
          static int* g_robotPositions;

          static int cmpRobotIndex(const void* pa, const void* pb) {
              int x = g_robotPositions[*(const int*)pa];
              int y = g_robotPositions[*(const int*)pb];
              return (x > y) - (x < y);
          }

          int* survivedRobotsHealths(int* positions, int positionsSize, int* healths, int healthsSize, const char* directions, int* returnSize) {
              int n = positionsSize;
              int* h = (int*)malloc(sizeof(int) * (n + 1));
              int* order = (int*)malloc(sizeof(int) * (n + 1));
              int* st = (int*)malloc(sizeof(int) * (n + 1));
              for (int i = 0; i < n; i++) { h[i] = healths[i]; order[i] = i; }
              g_robotPositions = positions;
              qsort(order, n, sizeof(int), cmpRobotIndex);
              int top = 0;
              for (int k = 0; k < n; k++) {
                  int cur = order[k];
                  if (directions[cur] == 'R') { st[top++] = cur; continue; }
                  while (top > 0 && h[cur] > 0) {
                      int j = st[top - 1];
                      if (h[j] < h[cur]) { h[j] = 0; top--; h[cur]--; }
                      else if (h[j] > h[cur]) { h[j]--; h[cur] = 0; }
                      else { h[j] = 0; h[cur] = 0; top--; }
                  }
              }
              int* res = (int*)malloc(sizeof(int) * (n + 1));
              int cnt = 0;
              for (int i = 0; i < n; i++) if (h[i] > 0) res[cnt++] = h[i];
              free(h);
              free(order);
              free(st);
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static int[] SurvivedRobotsHealths(int[] positions, int[] healths, string directions)
          {
              int n = positions.Length;
              int[] h = (int[])healths.Clone();
              int[] order = new int[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Array.Sort(order, (a, b) => positions[a].CompareTo(positions[b]));
              var st = new Stack<int>();
              foreach (int cur in order)
              {
                  if (directions[cur] == 'R') { st.Push(cur); continue; }
                  while (st.Count > 0 && h[cur] > 0)
                  {
                      int j = st.Peek();
                      if (h[j] < h[cur]) { h[j] = 0; st.Pop(); h[cur]--; }
                      else if (h[j] > h[cur]) { h[j]--; h[cur] = 0; }
                      else { h[j] = 0; h[cur] = 0; st.Pop(); }
                  }
              }
              var res = new List<int>();
              foreach (int x in h) if (x > 0) res.Add(x);
              return res.ToArray();
          }
        `,
        go: code`
          func survivedRobotsHealths(positions []int, healths []int, directions string) []int {
              n := len(positions)
              h := make([]int, n)
              copy(h, healths)
              order := make([]int, n)
              for i := range order {
                  order[i] = i
              }
              sort.Slice(order, func(a, b int) bool { return positions[order[a]] < positions[order[b]] })
              st := []int{}
              for _, cur := range order {
                  if directions[cur] == 'R' {
                      st = append(st, cur)
                      continue
                  }
                  for len(st) > 0 && h[cur] > 0 {
                      j := st[len(st)-1]
                      if h[j] < h[cur] {
                          h[j] = 0
                          st = st[:len(st)-1]
                          h[cur]--
                      } else if h[j] > h[cur] {
                          h[j]--
                          h[cur] = 0
                      } else {
                          h[j] = 0
                          h[cur] = 0
                          st = st[:len(st)-1]
                      }
                  }
              }
              res := []int{}
              for _, x := range h {
                  if x > 0 {
                      res = append(res, x)
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun survivedRobotsHealths(positions: IntArray, healths: IntArray, directions: String): IntArray {
              val n = positions.size
              val h = healths.copyOf()
              val order = (0 until n).sortedBy { positions[it] }
              val st = IntArray(n)
              var top = 0
              for (cur in order) {
                  if (directions[cur] == 'R') {
                      st[top++] = cur
                      continue
                  }
                  while (top > 0 && h[cur] > 0) {
                      val j = st[top - 1]
                      if (h[j] < h[cur]) {
                          h[j] = 0
                          top--
                          h[cur]--
                      } else if (h[j] > h[cur]) {
                          h[j]--
                          h[cur] = 0
                      } else {
                          h[j] = 0
                          h[cur] = 0
                          top--
                      }
                  }
              }
              return h.filter { it > 0 }.toIntArray()
          }
        `,
        swift: code`
          func survivedRobotsHealths(_ positions: [Int], _ healths: [Int], _ directions: String) -> [Int] {
              let n = positions.count
              var h = healths
              let dirs = Array(directions.utf8)
              let order = (0..<n).sorted { positions[$0] < positions[$1] }
              var st = [Int]()
              for cur in order {
                  if dirs[cur] == 82 {
                      st.append(cur)
                      continue
                  }
                  while !st.isEmpty && h[cur] > 0 {
                      let j = st[st.count - 1]
                      if h[j] < h[cur] {
                          h[j] = 0
                          st.removeLast()
                          h[cur] -= 1
                      } else if h[j] > h[cur] {
                          h[j] -= 1
                          h[cur] = 0
                      } else {
                          h[j] = 0
                          h[cur] = 0
                          st.removeLast()
                      }
                  }
              }
              return h.filter { $0 > 0 }
          }
        `,
        rust: code`
          fn survivedRobotsHealths(positions: Vec<i32>, healths: Vec<i32>, directions: String) -> Vec<i32> {
              let n = positions.len();
              let dirs = directions.as_bytes();
              let mut h = healths.clone();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by_key(|&i| positions[i]);
              let mut st: Vec<usize> = Vec::new();
              for &cur in order.iter() {
                  if dirs[cur] == b'R' {
                      st.push(cur);
                      continue;
                  }
                  while h[cur] > 0 {
                      let j = match st.last() {
                          Some(&j) => j,
                          None => break,
                      };
                      if h[j] < h[cur] {
                          h[j] = 0;
                          st.pop();
                          h[cur] -= 1;
                      } else if h[j] > h[cur] {
                          h[j] -= 1;
                          h[cur] = 0;
                      } else {
                          h[j] = 0;
                          h[cur] = 0;
                          st.pop();
                      }
                  }
              }
              h.into_iter().filter(|&x| x > 0).collect()
          }
        `,
        php: code`
          function survivedRobotsHealths($positions, $healths, $directions) {
              $n = count($positions);
              $h = $healths;
              $order = range(0, $n - 1);
              usort($order, function ($a, $b) use ($positions) {
                  return $positions[$a] <=> $positions[$b];
              });
              $st = [];
              foreach ($order as $cur) {
                  if ($directions[$cur] === 'R') {
                      $st[] = $cur;
                      continue;
                  }
                  while (!empty($st) && $h[$cur] > 0) {
                      $j = $st[count($st) - 1];
                      if ($h[$j] < $h[$cur]) {
                          $h[$j] = 0;
                          array_pop($st);
                          $h[$cur]--;
                      } elseif ($h[$j] > $h[$cur]) {
                          $h[$j]--;
                          $h[$cur] = 0;
                      } else {
                          $h[$j] = 0;
                          $h[$cur] = 0;
                          array_pop($st);
                      }
                  }
              }
              $res = [];
              foreach ($h as $x) if ($x > 0) $res[] = $x;
              return $res;
          }
        `,
        ruby: code`
          def survivedRobotsHealths(positions, healths, directions)
            n = positions.length
            h = healths.dup
            order = (0...n).sort_by { |i| positions[i] }
            st = []
            order.each do |cur|
              if directions[cur] == 'R'
                st << cur
                next
              end
              while !st.empty? && h[cur] > 0
                j = st[-1]
                if h[j] < h[cur]
                  h[j] = 0
                  st.pop
                  h[cur] -= 1
                elsif h[j] > h[cur]
                  h[j] -= 1
                  h[cur] = 0
                else
                  h[j] = 0
                  h[cur] = 0
                  st.pop
                end
              end
            end
            h.select { |x| x > 0 }
          end
        `,
      },
    };
  })(),

  // ── Check if a Parentheses String Can Be Valid (LC 2116) ───────
  (() => {
    // Reachable-balance DP: the set of open-bracket counts possible after each prefix.
    const ref = (s: string, locked: string) => {
      let can = new Set<number>([0]);
      for (let i = 0; i < s.length; i++) {
        const next = new Set<number>();
        for (const b of can) {
          const opts = locked[i] === "1" ? [s[i]] : ["(", ")"];
          for (const c of opts) {
            const nb = c === "(" ? b + 1 : b - 1;
            if (nb >= 0) next.add(nb);
          }
        }
        can = next;
      }
      return can.has(0);
    };
    return {
      slug: "check-if-a-parentheses-string-can-be-valid",
      title: "Check if a Parentheses String Can Be Valid",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Google", "Amazon", "Meta"],
      signature: {
        funcName: "canBeValid",
        params: [{ name: "s", type: "string" as const }, { name: "locked", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "A parentheses string is **valid** if it is empty, or is `AB` for valid strings `A` and `B`, or is `(A)` for a valid string `A` — in other words every `(` is closed by a later matching `)`.\n\nYou are given a string `s` of `(` and `)` and a binary string `locked` of the same length. If `locked[i]` is `'1'`, the character `s[i]` is fixed. If `locked[i]` is `'0'`, you may change `s[i]` to either `(` or `)`.\n\nReturn `true` if you can make `s` valid.",
        [
          { in: "s = \"))((\", locked = \"0110\"", out: "true", note: "Change the first character to `(` and the last to `)`: `()()`." },
          { in: "s = \"(((\", locked = \"000\"", out: "false", note: "An odd-length string can never be valid." },
          { in: "s = \"())(\", locked = \"1101\"", out: "false", note: "The last character is a locked `(` that nothing after it can close." },
        ],
        ["n == s.length == locked.length", "1 <= n <= 10^5", "s[i] is '(' or ')'", "locked[i] is '0' or '1'"]),
      hints: [
        "An odd length is hopeless. Otherwise, think of every unlocked position as a wildcard.",
        "Reading left to right, each locked `)` needs some earlier `(` or wildcard to match it. Reading right to left, each locked `(` needs a later `)` or wildcard.",
        "Two counters suffice: left to right, count `(` or wildcard as +1 and locked `)` as -1 and fail if it goes negative; then the mirror pass from the right.",
      ],
      editorial: explain({
        idea: "Treat unlocked characters as wildcards. A string with wildcards can be completed exactly when its length is even, no prefix has more locked `)` than other characters, and no suffix has more locked `(` than other characters.",
        steps: [
          "If `n` is odd, return `false`.",
          "Left to right: `bal += 1` for a wildcard or a locked `(`, `bal -= 1` for a locked `)`; if `bal < 0`, return `false`.",
          "Right to left: `bal += 1` for a wildcard or a locked `)`, `bal -= 1` for a locked `(`; if `bal < 0`, return `false`.",
          "Return `true`.",
        ],
        why: "Both conditions are clearly necessary: a locked `)` needs a partner on its left and a locked `(` a partner on its right. They are also sufficient: the forward pass guarantees enough openers for every locked closer, the backward pass enough closers for every locked opener, and with an even length the leftover wildcards can be split into matching halves — the first half of them opened, the second half closed — which keeps every prefix balance non-negative and ends at zero.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "One pass is not enough: `\"()((\"` with only the last two characters locked passes the forward check and fails the backward one.",
          "Forgetting the odd-length check gives `true` for an all-wildcard string such as `\"(((\"` with `locked = \"000\"`.",
          "Treat a wildcard as helping both passes — it is `+1` in each direction.",
        ],
      }),
      examples: [
        { input: "\"))((\"\n\"0110\"", expectedOutput: "true" },
        { input: "\"(((\"\n\"000\"", expectedOutput: "false" },
        { input: "\"())(\"\n\"1101\"", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        let n = ri(rng, 1, pick(rng, [2, 8, 40]));
        let s = "";
        if (rng() < 0.5) {
          // start from a valid string, then scramble some characters
          if (n % 2 === 1) n++;
          let open = 0, left = n / 2;
          for (let i = 0; i < n; i++) {
            const canOpen = left > 0;
            const canClose = open > 0;
            if (canOpen && (!canClose || rng() < 0.5)) { s += "("; open++; left--; } else { s += ")"; open--; }
          }
          const flips = ri(rng, 0, 2);
          for (let f = 0; f < flips; f++) {
            const i = ri(rng, 0, n - 1);
            s = s.slice(0, i) + (s[i] === "(" ? ")" : "(") + s.slice(i + 1);
          }
        } else {
          for (let i = 0; i < n; i++) s += rng() < 0.5 ? "(" : ")";
        }
        const pLock = pick(rng, [0, 0.3, 0.7, 1]);
        let locked = "";
        for (let i = 0; i < n; i++) locked += rng() < pLock ? "1" : "0";
        return { input: `"${s}"\n"${locked}"`, expectedOutput: bool(ref(s, locked)) };
      },
      solutions: {
        python: code`
          def canBeValid(s: str, locked: str) -> bool:
              n = len(s)
              if n % 2 == 1:
                  return False
              bal = 0
              for i in range(n):
                  bal += 1 if locked[i] == '0' or s[i] == '(' else -1
                  if bal < 0:
                      return False
              bal = 0
              for i in range(n - 1, -1, -1):
                  bal += 1 if locked[i] == '0' or s[i] == ')' else -1
                  if bal < 0:
                      return False
              return True
        `,
        javascript: code`
          var canBeValid = function(s, locked) {
              var n = s.length;
              if (n % 2 === 1) return false;
              var bal = 0;
              for (var i = 0; i < n; i++) {
                  bal += (locked[i] === "0" || s[i] === "(") ? 1 : -1;
                  if (bal < 0) return false;
              }
              bal = 0;
              for (var j = n - 1; j >= 0; j--) {
                  bal += (locked[j] === "0" || s[j] === ")") ? 1 : -1;
                  if (bal < 0) return false;
              }
              return true;
          };
        `,
        typescript: code`
          function canBeValid(s: string, locked: string): boolean {
              var n = s.length;
              if (n % 2 === 1) return false;
              var bal = 0;
              for (var i = 0; i < n; i++) {
                  bal += (locked.charAt(i) === "0" || s.charAt(i) === "(") ? 1 : -1;
                  if (bal < 0) return false;
              }
              bal = 0;
              for (var j = n - 1; j >= 0; j--) {
                  bal += (locked.charAt(j) === "0" || s.charAt(j) === ")") ? 1 : -1;
                  if (bal < 0) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean canBeValid(String s, String locked) {
              int n = s.length();
              if (n % 2 == 1) return false;
              int bal = 0;
              for (int i = 0; i < n; i++) {
                  bal += (locked.charAt(i) == '0' || s.charAt(i) == '(') ? 1 : -1;
                  if (bal < 0) return false;
              }
              bal = 0;
              for (int i = n - 1; i >= 0; i--) {
                  bal += (locked.charAt(i) == '0' || s.charAt(i) == ')') ? 1 : -1;
                  if (bal < 0) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool canBeValid(string s, string locked) {
              int n = s.size();
              if (n % 2 == 1) return false;
              int bal = 0;
              for (int i = 0; i < n; i++) {
                  bal += (locked[i] == '0' || s[i] == '(') ? 1 : -1;
                  if (bal < 0) return false;
              }
              bal = 0;
              for (int i = n - 1; i >= 0; i--) {
                  bal += (locked[i] == '0' || s[i] == ')') ? 1 : -1;
                  if (bal < 0) return false;
              }
              return true;
          }
        `,
        c: code`
          bool canBeValid(const char* s, const char* locked) {
              int n = (int)strlen(s);
              if (n % 2 == 1) return false;
              int bal = 0;
              for (int i = 0; i < n; i++) {
                  bal += (locked[i] == '0' || s[i] == '(') ? 1 : -1;
                  if (bal < 0) return false;
              }
              bal = 0;
              for (int i = n - 1; i >= 0; i--) {
                  bal += (locked[i] == '0' || s[i] == ')') ? 1 : -1;
                  if (bal < 0) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CanBeValid(string s, string locked)
          {
              int n = s.Length;
              if (n % 2 == 1) return false;
              int bal = 0;
              for (int i = 0; i < n; i++)
              {
                  bal += (locked[i] == '0' || s[i] == '(') ? 1 : -1;
                  if (bal < 0) return false;
              }
              bal = 0;
              for (int i = n - 1; i >= 0; i--)
              {
                  bal += (locked[i] == '0' || s[i] == ')') ? 1 : -1;
                  if (bal < 0) return false;
              }
              return true;
          }
        `,
        go: code`
          func canBeValid(s string, locked string) bool {
              n := len(s)
              if n%2 == 1 {
                  return false
              }
              bal := 0
              for i := 0; i < n; i++ {
                  if locked[i] == '0' || s[i] == '(' {
                      bal++
                  } else {
                      bal--
                  }
                  if bal < 0 {
                      return false
                  }
              }
              bal = 0
              for i := n - 1; i >= 0; i-- {
                  if locked[i] == '0' || s[i] == ')' {
                      bal++
                  } else {
                      bal--
                  }
                  if bal < 0 {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun canBeValid(s: String, locked: String): Boolean {
              val n = s.length
              if (n % 2 == 1) return false
              var bal = 0
              for (i in 0 until n) {
                  bal += if (locked[i] == '0' || s[i] == '(') 1 else -1
                  if (bal < 0) return false
              }
              bal = 0
              for (i in n - 1 downTo 0) {
                  bal += if (locked[i] == '0' || s[i] == ')') 1 else -1
                  if (bal < 0) return false
              }
              return true
          }
        `,
        swift: code`
          func canBeValid(_ s: String, _ locked: String) -> Bool {
              let a = Array(s.utf8)
              let l = Array(locked.utf8)
              let n = a.count
              if n % 2 == 1 { return false }
              var bal = 0
              for i in 0..<n {
                  bal += (l[i] == 48 || a[i] == 40) ? 1 : -1
                  if bal < 0 { return false }
              }
              bal = 0
              for i in stride(from: n - 1, through: 0, by: -1) {
                  bal += (l[i] == 48 || a[i] == 41) ? 1 : -1
                  if bal < 0 { return false }
              }
              return true
          }
        `,
        rust: code`
          fn canBeValid(s: String, locked: String) -> bool {
              let a = s.as_bytes();
              let l = locked.as_bytes();
              let n = a.len();
              if n % 2 == 1 {
                  return false;
              }
              let mut bal: i32 = 0;
              for i in 0..n {
                  bal += if l[i] == b'0' || a[i] == b'(' { 1 } else { -1 };
                  if bal < 0 {
                      return false;
                  }
              }
              bal = 0;
              for i in (0..n).rev() {
                  bal += if l[i] == b'0' || a[i] == b')' { 1 } else { -1 };
                  if bal < 0 {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function canBeValid($s, $locked) {
              $n = strlen($s);
              if ($n % 2 == 1) return false;
              $bal = 0;
              for ($i = 0; $i < $n; $i++) {
                  $bal += ($locked[$i] === '0' || $s[$i] === '(') ? 1 : -1;
                  if ($bal < 0) return false;
              }
              $bal = 0;
              for ($i = $n - 1; $i >= 0; $i--) {
                  $bal += ($locked[$i] === '0' || $s[$i] === ')') ? 1 : -1;
                  if ($bal < 0) return false;
              }
              return true;
          }
        `,
        ruby: code`
          def canBeValid(s, locked)
            n = s.length
            return false if n.odd?
            bal = 0
            n.times do |i|
              bal += (locked[i] == '0' || s[i] == '(') ? 1 : -1
              return false if bal < 0
            end
            bal = 0
            (n - 1).downto(0) do |i|
              bal += (locked[i] == '0' || s[i] == ')') ? 1 : -1
              return false if bal < 0
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Jump Game VI (LC 1696) ─────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const dp = new Array(nums.length).fill(-Infinity);
      dp[0] = nums[0];
      for (let i = 1; i < nums.length; i++) {
        for (let j = Math.max(0, i - k); j < i; j++) dp[i] = Math.max(dp[i], dp[j] + nums[i]);
      }
      return dp[nums.length - 1];
    };
    return {
      slug: "jump-game-vi",
      title: "Jump Game VI",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Queue", "Monotonic Queue", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "maxResult",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You start on index `0` of the integer array `nums` and want to reach the last index. From index `i` you may jump forward by 1 to `k` steps, to any index in `[i + 1, min(n - 1, i + k)]`.\n\nYour **score** is the sum of `nums[j]` over every index `j` you stand on, including the first and the last. Return the maximum score you can achieve.",
        [
          { in: "nums = [2,-3,5,-1,-4,6], k = 2", out: "12", note: "Visit indices 0, 2, 3, 5: 2 + 5 - 1 + 6 = 12." },
          { in: "nums = [4,-8,-8,-8,1], k = 3", out: "-3", note: "Some negative square must be used: 4 - 8 + 1." },
          { in: "nums = [7], k = 1", out: "7" },
        ],
        ["1 <= nums.length, k <= 10^5", "-10^4 <= nums[i] <= 10^4"]),
      hints: [
        "Let `dp[i]` be the best score of a path ending at `i`. Then `dp[i] = nums[i] + max(dp[i - k..i - 1])`.",
        "Computing that maximum directly costs O(k) per index. You need the maximum of a sliding window.",
        "Keep a deque of indices whose `dp` values decrease from front to back; drop indices that left the window from the front and dominated ones from the back.",
      ],
      editorial: explain({
        idea: "The DP `dp[i] = nums[i] + max(dp[i - k..i - 1])` is a sliding-window maximum over the `dp` array itself, which a monotonic deque serves in amortised O(1).",
        steps: [
          "Set `dp[0] = nums[0]` and a deque holding index 0.",
          "For each `i` from 1: pop indices `< i - k` from the front; the front is now the best predecessor, so `dp[i] = dp[front] + nums[i]`.",
          "Pop indices from the back while their `dp` is `<= dp[i]`, then push `i`.",
          "Return `dp[n - 1]`.",
        ],
        why: "The deque always holds, in increasing index order, the indices of the window that could still be a maximum later: an index with a smaller-or-equal `dp` than a newer index can never win again, because the newer one stays in the window at least as long. So `dp` values decrease along the deque and its front is the window maximum.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A greedy 'jump to the next non-negative number' fails when a negative step is unavoidable.",
          "Expire indices before reading the front: the window is `[i - k, i - 1]`.",
          "Scores can be negative; never initialise a maximum to 0.",
        ],
      }),
      examples: [
        { input: "[2,-3,5,-1,-4,6]\n2", expectedOutput: "12" },
        { input: "[4,-8,-8,-8,1]\n3", expectedOutput: "-3" },
        { input: "[7]\n1", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [5, 100, 10000]);
        const negBias = pick(rng, [0, 0.5, 0.8]);
        const nums = Array.from({ length: n }, () => (rng() < negBias ? -ri(rng, 0, hi) : ri(rng, -hi, hi)));
        const k = pick(rng, [1, ri(rng, 1, n), ri(rng, 1, 3), n + ri(rng, 0, 5)]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def maxResult(nums: List[int], k: int) -> int:
              n = len(nums)
              dp = [0] * n
              dp[0] = nums[0]
              dq = deque([0])
              for i in range(1, n):
                  while dq[0] < i - k:
                      dq.popleft()
                  dp[i] = dp[dq[0]] + nums[i]
                  while dq and dp[dq[-1]] <= dp[i]:
                      dq.pop()
                  dq.append(i)
              return dp[-1]
        `,
        javascript: code`
          var maxResult = function(nums, k) {
              var n = nums.length;
              var dp = new Array(n);
              dp[0] = nums[0];
              var dq = new Array(n);
              var head = 0, tail = 0;
              dq[tail++] = 0;
              for (var i = 1; i < n; i++) {
                  while (dq[head] < i - k) head++;
                  dp[i] = dp[dq[head]] + nums[i];
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--;
                  dq[tail++] = i;
              }
              return dp[n - 1];
          };
        `,
        typescript: code`
          function maxResult(nums: number[], k: number): number {
              var n = nums.length;
              var dp: number[] = [];
              var dq: number[] = [];
              for (var z = 0; z < n; z++) { dp.push(0); dq.push(0); }
              dp[0] = nums[0];
              var head = 0, tail = 0;
              dq[tail++] = 0;
              for (var i = 1; i < n; i++) {
                  while (dq[head] < i - k) head++;
                  dp[i] = dp[dq[head]] + nums[i];
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--;
                  dq[tail++] = i;
              }
              return dp[n - 1];
          }
        `,
        java: code`
          public static int maxResult(int[] nums, int k) {
              int n = nums.length;
              int[] dp = new int[n];
              int[] dq = new int[n];
              int head = 0, tail = 0;
              dp[0] = nums[0];
              dq[tail++] = 0;
              for (int i = 1; i < n; i++) {
                  while (dq[head] < i - k) head++;
                  dp[i] = dp[dq[head]] + nums[i];
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--;
                  dq[tail++] = i;
              }
              return dp[n - 1];
          }
        `,
        cpp: code`
          int maxResult(vector<int>& nums, int k) {
              int n = nums.size();
              vector<int> dp(n), dq(n);
              int head = 0, tail = 0;
              dp[0] = nums[0];
              dq[tail++] = 0;
              for (int i = 1; i < n; i++) {
                  while (dq[head] < i - k) head++;
                  dp[i] = dp[dq[head]] + nums[i];
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--;
                  dq[tail++] = i;
              }
              return dp[n - 1];
          }
        `,
        c: code`
          int maxResult(int* nums, int numsSize, int k) {
              int n = numsSize;
              int* dp = (int*)malloc(sizeof(int) * n);
              int* dq = (int*)malloc(sizeof(int) * n);
              int head = 0, tail = 0;
              dp[0] = nums[0];
              dq[tail++] = 0;
              for (int i = 1; i < n; i++) {
                  while (dq[head] < i - k) head++;
                  dp[i] = dp[dq[head]] + nums[i];
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--;
                  dq[tail++] = i;
              }
              int result = dp[n - 1];
              free(dp);
              free(dq);
              return result;
          }
        `,
        csharp: code`
          public static int MaxResult(int[] nums, int k)
          {
              int n = nums.Length;
              int[] dp = new int[n];
              int[] dq = new int[n];
              int head = 0, tail = 0;
              dp[0] = nums[0];
              dq[tail++] = 0;
              for (int i = 1; i < n; i++)
              {
                  while (dq[head] < i - k) head++;
                  dp[i] = dp[dq[head]] + nums[i];
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--;
                  dq[tail++] = i;
              }
              return dp[n - 1];
          }
        `,
        go: code`
          func maxResult(nums []int, k int) int {
              n := len(nums)
              dp := make([]int, n)
              dq := make([]int, n)
              head, tail := 0, 0
              dp[0] = nums[0]
              dq[tail] = 0
              tail++
              for i := 1; i < n; i++ {
                  for dq[head] < i-k {
                      head++
                  }
                  dp[i] = dp[dq[head]] + nums[i]
                  for tail > head && dp[dq[tail-1]] <= dp[i] {
                      tail--
                  }
                  dq[tail] = i
                  tail++
              }
              return dp[n-1]
          }
        `,
        kotlin: code`
          fun maxResult(nums: IntArray, k: Int): Int {
              val n = nums.size
              val dp = IntArray(n)
              val dq = IntArray(n)
              var head = 0
              var tail = 0
              dp[0] = nums[0]
              dq[tail++] = 0
              for (i in 1 until n) {
                  while (dq[head] < i - k) head++
                  dp[i] = dp[dq[head]] + nums[i]
                  while (tail > head && dp[dq[tail - 1]] <= dp[i]) tail--
                  dq[tail++] = i
              }
              return dp[n - 1]
          }
        `,
        swift: code`
          func maxResult(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var dp = [Int](repeating: 0, count: n)
              var dq = [Int](repeating: 0, count: n)
              var head = 0
              var tail = 0
              dp[0] = nums[0]
              dq[tail] = 0
              tail += 1
              var i = 1
              while i < n {
                  while dq[head] < i - k { head += 1 }
                  dp[i] = dp[dq[head]] + nums[i]
                  while tail > head && dp[dq[tail - 1]] <= dp[i] { tail -= 1 }
                  dq[tail] = i
                  tail += 1
                  i += 1
              }
              return dp[n - 1]
          }
        `,
        rust: code`
          fn maxResult(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let k = k as usize;
              let mut dp = vec![0i32; n];
              let mut dq = vec![0usize; n];
              let mut head = 0usize;
              let mut tail = 0usize;
              dp[0] = nums[0];
              dq[tail] = 0;
              tail += 1;
              for i in 1..n {
                  while dq[head] + k < i {
                      head += 1;
                  }
                  dp[i] = dp[dq[head]] + nums[i];
                  while tail > head && dp[dq[tail - 1]] <= dp[i] {
                      tail -= 1;
                  }
                  dq[tail] = i;
                  tail += 1;
              }
              dp[n - 1]
          }
        `,
        php: code`
          function maxResult($nums, $k) {
              $n = count($nums);
              $dp = array_fill(0, $n, 0);
              $dq = array_fill(0, $n, 0);
              $head = 0;
              $tail = 0;
              $dp[0] = $nums[0];
              $dq[$tail++] = 0;
              for ($i = 1; $i < $n; $i++) {
                  while ($dq[$head] < $i - $k) $head++;
                  $dp[$i] = $dp[$dq[$head]] + $nums[$i];
                  while ($tail > $head && $dp[$dq[$tail - 1]] <= $dp[$i]) $tail--;
                  $dq[$tail++] = $i;
              }
              return $dp[$n - 1];
          }
        `,
        ruby: code`
          def maxResult(nums, k)
            n = nums.length
            dp = Array.new(n, 0)
            dq = Array.new(n, 0)
            head = 0
            tail = 0
            dp[0] = nums[0]
            dq[tail] = 0
            tail += 1
            (1...n).each do |i|
              head += 1 while dq[head] < i - k
              dp[i] = dp[dq[head]] + nums[i]
              tail -= 1 while tail > head && dp[dq[tail - 1]] <= dp[i]
              dq[tail] = i
              tail += 1
            end
            dp[n - 1]
          end
        `,
      },
    };
  })(),

  // ── Find the Number of Subarrays Where Boundary Elements Are Maximum (LC 3113) ──
  (() => {
    const ref = (nums: number[]) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let mx = -Infinity;
        for (let j = i; j < nums.length; j++) {
          mx = Math.max(mx, nums[j]);
          if (nums[i] === mx && nums[j] === mx) count++;
        }
      }
      return count;
    };
    return {
      slug: "find-the-number-of-subarrays-where-boundary-elements-are-maximum",
      title: "Find the Number of Subarrays Where Boundary Elements Are Maximum",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Stack", "Monotonic Stack", "Google", "Amazon"],
      signature: { funcName: "numberOfSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `nums`, count the subarrays whose **first** and **last** elements are both equal to the **largest** element of that subarray.\n\nA single element is such a subarray on its own.\n\n(The length bound below is tighter than the original problem's so that the count fits in a 32-bit integer.)",
        [
          { in: "nums = [2,5,2,5,1]", out: "6", note: "The five single elements, plus `[5,2,5]`. `[2,5,2]` does not count: its largest element is 5." },
          { in: "nums = [4,4,4]", out: "6", note: "Every subarray qualifies." },
          { in: "nums = [3,1,3,1,3]", out: "8", note: "Five singles plus `[3,1,3]` twice and the whole array." },
        ],
        ["1 <= nums.length <= 6 * 10^4", "1 <= nums[i] <= 10^9"]),
      hints: [
        "Fix the right end `j`. Which left ends `i` work? `nums[i]` must equal `nums[j]` and nothing between them may be larger.",
        "So you need, for the current value, how many equal values appear since the last strictly larger value.",
        "Keep a stack of `(value, count)` with strictly decreasing values. For `x`, pop smaller values; if the top equals `x`, increment its count, otherwise push `(x, 1)`. Add the top's count to the answer.",
      ],
      editorial: explain({
        idea: "A valid subarray ending at `j` starts at an earlier copy of `nums[j]` with no larger value in between. A monotonic stack that merges equal values keeps exactly that count for the current value.",
        steps: [
          "Keep a stack of pairs `(value, count)` with strictly decreasing values from bottom to top.",
          "For each `x`: pop while the top's value is smaller than `x` — those values are now blocked by `x` forever.",
          "If the top's value equals `x`, increment its count; otherwise push `(x, 1)`.",
          "The top's count is the number of valid subarrays ending at this position; add it to the answer.",
        ],
        why: "After processing position `j`, the top entry for value `nums[j]` counts the occurrences of `nums[j]` since the most recent strictly larger element — any older copy is separated from `j` by something larger and was removed when that larger value popped it. Each such occurrence is a valid left end, and no other left end is valid, so the per-position additions sum to the answer.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Pop only strictly smaller values; equal values must be merged, not discarded.",
          "Each position contributes at least 1 — the single-element subarray.",
          "An all-equal array gives n(n+1)/2 subarrays, which is why the length is capped here.",
        ],
      }),
      examples: [
        { input: "[2,5,2,5,1]", expectedOutput: "6" },
        { input: "[4,4,4]", expectedOutput: "6" },
        { input: "[3,1,3,1,3]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [1, 3, 8, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const shape = ri(rng, 0, 6);
        if (shape === 0) nums.sort((a, b) => a - b);
        else if (shape === 1) nums.sort((a, b) => b - a);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numberOfSubarrays(nums: List[int]) -> int:
              st = []  # [value, count], values strictly decreasing
              ans = 0
              for x in nums:
                  while st and st[-1][0] < x:
                      st.pop()
                  if st and st[-1][0] == x:
                      st[-1][1] += 1
                  else:
                      st.append([x, 1])
                  ans += st[-1][1]
              return ans
        `,
        javascript: code`
          var numberOfSubarrays = function(nums) {
              var vals = [], cnts = [];
              var ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  while (vals.length > 0 && vals[vals.length - 1] < x) { vals.pop(); cnts.pop(); }
                  if (vals.length > 0 && vals[vals.length - 1] === x) {
                      cnts[cnts.length - 1]++;
                  } else {
                      vals.push(x);
                      cnts.push(1);
                  }
                  ans += cnts[cnts.length - 1];
              }
              return ans;
          };
        `,
        typescript: code`
          function numberOfSubarrays(nums: number[]): number {
              var vals: number[] = [], cnts: number[] = [];
              var ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  while (vals.length > 0 && vals[vals.length - 1] < x) { vals.pop(); cnts.pop(); }
                  if (vals.length > 0 && vals[vals.length - 1] === x) {
                      cnts[cnts.length - 1]++;
                  } else {
                      vals.push(x);
                      cnts.push(1);
                  }
                  ans += cnts[cnts.length - 1];
              }
              return ans;
          }
        `,
        java: code`
          public static int numberOfSubarrays(int[] nums) {
              int n = nums.length;
              int[] vals = new int[n], cnts = new int[n];
              int top = 0;
              long ans = 0;
              for (int x : nums) {
                  while (top > 0 && vals[top - 1] < x) top--;
                  if (top > 0 && vals[top - 1] == x) {
                      cnts[top - 1]++;
                  } else {
                      vals[top] = x;
                      cnts[top] = 1;
                      top++;
                  }
                  ans += cnts[top - 1];
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int numberOfSubarrays(vector<int>& nums) {
              vector<pair<int, int>> st;
              long long ans = 0;
              for (int x : nums) {
                  while (!st.empty() && st.back().first < x) st.pop_back();
                  if (!st.empty() && st.back().first == x) {
                      st.back().second++;
                  } else {
                      st.push_back(make_pair(x, 1));
                  }
                  ans += st.back().second;
              }
              return (int)ans;
          }
        `,
        c: code`
          int numberOfSubarrays(int* nums, int numsSize) {
              int* vals = (int*)malloc(sizeof(int) * (numsSize + 1));
              int* cnts = (int*)malloc(sizeof(int) * (numsSize + 1));
              int top = 0;
              long long ans = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  while (top > 0 && vals[top - 1] < x) top--;
                  if (top > 0 && vals[top - 1] == x) {
                      cnts[top - 1]++;
                  } else {
                      vals[top] = x;
                      cnts[top] = 1;
                      top++;
                  }
                  ans += cnts[top - 1];
              }
              free(vals);
              free(cnts);
              return (int)ans;
          }
        `,
        csharp: code`
          public static int NumberOfSubarrays(int[] nums)
          {
              int n = nums.Length;
              int[] vals = new int[n], cnts = new int[n];
              int top = 0;
              long ans = 0;
              foreach (int x in nums)
              {
                  while (top > 0 && vals[top - 1] < x) top--;
                  if (top > 0 && vals[top - 1] == x)
                  {
                      cnts[top - 1]++;
                  }
                  else
                  {
                      vals[top] = x;
                      cnts[top] = 1;
                      top++;
                  }
                  ans += cnts[top - 1];
              }
              return (int)ans;
          }
        `,
        go: code`
          func numberOfSubarrays(nums []int) int {
              vals := []int{}
              cnts := []int{}
              ans := 0
              for _, x := range nums {
                  for len(vals) > 0 && vals[len(vals)-1] < x {
                      vals = vals[:len(vals)-1]
                      cnts = cnts[:len(cnts)-1]
                  }
                  if len(vals) > 0 && vals[len(vals)-1] == x {
                      cnts[len(cnts)-1]++
                  } else {
                      vals = append(vals, x)
                      cnts = append(cnts, 1)
                  }
                  ans += cnts[len(cnts)-1]
              }
              return ans
          }
        `,
        kotlin: code`
          fun numberOfSubarrays(nums: IntArray): Int {
              val n = nums.size
              val vals = IntArray(n)
              val cnts = IntArray(n)
              var top = 0
              var ans = 0L
              for (x in nums) {
                  while (top > 0 && vals[top - 1] < x) top--
                  if (top > 0 && vals[top - 1] == x) {
                      cnts[top - 1]++
                  } else {
                      vals[top] = x
                      cnts[top] = 1
                      top++
                  }
                  ans += cnts[top - 1]
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func numberOfSubarrays(_ nums: [Int]) -> Int {
              var vals = [Int]()
              var cnts = [Int]()
              var ans = 0
              for x in nums {
                  while let last = vals.last, last < x {
                      vals.removeLast()
                      cnts.removeLast()
                  }
                  if let last = vals.last, last == x {
                      cnts[cnts.count - 1] += 1
                  } else {
                      vals.append(x)
                      cnts.append(1)
                  }
                  ans += cnts[cnts.count - 1]
              }
              return ans
          }
        `,
        rust: code`
          fn numberOfSubarrays(nums: Vec<i32>) -> i32 {
              let mut st: Vec<(i32, i64)> = Vec::new();
              let mut ans: i64 = 0;
              for &x in nums.iter() {
                  while let Some(&(v, _)) = st.last() {
                      if v < x {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  let same = match st.last() {
                      Some(&(v, _)) => v == x,
                      None => false,
                  };
                  if same {
                      let last = st.len() - 1;
                      st[last].1 += 1;
                  } else {
                      st.push((x, 1));
                  }
                  ans += st[st.len() - 1].1;
              }
              ans as i32
          }
        `,
        php: code`
          function numberOfSubarrays($nums) {
              $vals = [];
              $cnts = [];
              $ans = 0;
              foreach ($nums as $x) {
                  while (!empty($vals) && $vals[count($vals) - 1] < $x) {
                      array_pop($vals);
                      array_pop($cnts);
                  }
                  if (!empty($vals) && $vals[count($vals) - 1] == $x) {
                      $cnts[count($cnts) - 1]++;
                  } else {
                      $vals[] = $x;
                      $cnts[] = 1;
                  }
                  $ans += $cnts[count($cnts) - 1];
              }
              return $ans;
          }
        `,
        ruby: code`
          def numberOfSubarrays(nums)
            st = []
            ans = 0
            nums.each do |x|
              st.pop while !st.empty? && st[-1][0] < x
              if !st.empty? && st[-1][0] == x
                st[-1][1] += 1
              else
                st << [x, 1]
              end
              ans += st[-1][1]
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Nearest Smaller Element (InterviewBit) ─────────────────────
  (() => {
    const ref = (arr: number[]) => arr.map((x, i) => {
      for (let j = i - 1; j >= 0; j--) if (arr[j] < x) return arr[j];
      return -1;
    });
    return {
      slug: "nearest-smaller-element",
      title: "Nearest Smaller Element",
      difficulty: "EASY" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Amazon", "Microsoft", "Flipkart"],
      signature: { funcName: "prevSmaller", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "For every position `i` of the array `arr`, find the **nearest smaller element to its left**: the value `arr[j]` with the largest index `j < i` such that `arr[j] < arr[i]` (strictly smaller).\n\nIf no element to the left of `i` is smaller, the answer for `i` is `-1`. Return the array of answers.",
        [
          { in: "arr = [4,5,2,10,8]", out: "[-1,4,-1,2,2]", note: "For 8 the nearest smaller value to the left is 2 — 10 is larger." },
          { in: "arr = [6,2,7,7,3,9]", out: "[-1,-1,2,2,2,3]", note: "The second 7 skips the first: equal is not smaller." },
          { in: "arr = [3,2,1]", out: "[-1,-1,-1]" },
        ],
        ["1 <= arr.length <= 10^5", "0 <= arr[i] <= 10^9"]),
      hints: [
        "Scanning left from every position is O(n²) on a sorted array. Which earlier values can never be an answer again?",
        "Once a value `v` appears, every earlier value `>= v` is hidden behind it for all later positions.",
        "Keep a stack of values increasing from bottom to top: pop values `>= arr[i]`, the top (if any) is the answer, then push `arr[i]`.",
      ],
      editorial: explain({
        idea: "The candidates for 'nearest smaller to the left' form an increasing sequence, so a monotonic stack holds exactly them.",
        steps: [
          "Keep a stack of values, strictly increasing from bottom to top.",
          "For each `arr[i]`, pop while the top is `>= arr[i]`.",
          "The answer is the top if the stack is non-empty, otherwise `-1`.",
          "Push `arr[i]`.",
        ],
        why: "A popped value `v >= arr[i]` lies to the left of `i`, so for any later position the element `arr[i]` is both nearer and no larger — `v` could only be the answer if `arr[i]` also were, and `arr[i]` would win by being nearer. What remains on the stack after popping are values smaller than `arr[i]`, and the top is the nearest of them.",
        time: "O(n) — each value is pushed and popped at most once",
        space: "O(n)",
        pitfalls: [
          "Pop on `>=`, not `>`: an equal value is not smaller.",
          "The answer is the value, not the index.",
          "Push the current value after answering, not before.",
        ],
      }),
      examples: [
        { input: "[4,5,2,10,8]", expectedOutput: "[-1,4,-1,2,2]" },
        { input: "[6,2,7,7,3,9]", expectedOutput: "[-1,-1,2,2,2,3]" },
        { input: "[3,2,1]", expectedOutput: "[-1,-1,-1]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 20, 1000000000]);
        const arr = Array.from({ length: n }, () => ri(rng, 0, hi));
        const shape = ri(rng, 0, 6);
        if (shape === 0) arr.sort((a, b) => a - b);
        else if (shape === 1) arr.sort((a, b) => b - a);
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def prevSmaller(arr: List[int]) -> List[int]:
              st = []
              res = []
              for x in arr:
                  while st and st[-1] >= x:
                      st.pop()
                  res.append(st[-1] if st else -1)
                  st.append(x)
              return res
        `,
        javascript: code`
          var prevSmaller = function(arr) {
              var st = [], res = [];
              for (var i = 0; i < arr.length; i++) {
                  while (st.length > 0 && st[st.length - 1] >= arr[i]) st.pop();
                  res.push(st.length > 0 ? st[st.length - 1] : -1);
                  st.push(arr[i]);
              }
              return res;
          };
        `,
        typescript: code`
          function prevSmaller(arr: number[]): number[] {
              var st: number[] = [], res: number[] = [];
              for (var i = 0; i < arr.length; i++) {
                  while (st.length > 0 && st[st.length - 1] >= arr[i]) st.pop();
                  res.push(st.length > 0 ? st[st.length - 1] : -1);
                  st.push(arr[i]);
              }
              return res;
          }
        `,
        java: code`
          public static int[] prevSmaller(int[] arr) {
              int n = arr.length;
              int[] res = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  while (top > 0 && st[top - 1] >= arr[i]) top--;
                  res[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = arr[i];
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> prevSmaller(vector<int>& arr) {
              vector<int> st, res;
              for (int x : arr) {
                  while (!st.empty() && st.back() >= x) st.pop_back();
                  res.push_back(st.empty() ? -1 : st.back());
                  st.push_back(x);
              }
              return res;
          }
        `,
        c: code`
          int* prevSmaller(int* arr, int arrSize, int* returnSize) {
              int cap = arrSize > 0 ? arrSize : 1;
              int* res = (int*)malloc(sizeof(int) * cap);
              int* st = (int*)malloc(sizeof(int) * cap);
              int top = 0;
              for (int i = 0; i < arrSize; i++) {
                  while (top > 0 && st[top - 1] >= arr[i]) top--;
                  res[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = arr[i];
              }
              free(st);
              *returnSize = arrSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] PrevSmaller(int[] arr)
          {
              int n = arr.Length;
              int[] res = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  while (top > 0 && st[top - 1] >= arr[i]) top--;
                  res[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = arr[i];
              }
              return res;
          }
        `,
        go: code`
          func prevSmaller(arr []int) []int {
              res := make([]int, len(arr))
              st := []int{}
              for i, x := range arr {
                  for len(st) > 0 && st[len(st)-1] >= x {
                      st = st[:len(st)-1]
                  }
                  if len(st) > 0 {
                      res[i] = st[len(st)-1]
                  } else {
                      res[i] = -1
                  }
                  st = append(st, x)
              }
              return res
          }
        `,
        kotlin: code`
          fun prevSmaller(arr: IntArray): IntArray {
              val n = arr.size
              val res = IntArray(n)
              val st = IntArray(n)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && st[top - 1] >= arr[i]) top--
                  res[i] = if (top > 0) st[top - 1] else -1
                  st[top++] = arr[i]
              }
              return res
          }
        `,
        swift: code`
          func prevSmaller(_ arr: [Int]) -> [Int] {
              var st = [Int]()
              var res = [Int]()
              for x in arr {
                  while let last = st.last, last >= x { st.removeLast() }
                  res.append(st.last ?? -1)
                  st.append(x)
              }
              return res
          }
        `,
        rust: code`
          fn prevSmaller(arr: Vec<i32>) -> Vec<i32> {
              let mut st: Vec<i32> = Vec::new();
              let mut res: Vec<i32> = Vec::with_capacity(arr.len());
              for &x in arr.iter() {
                  while let Some(&last) = st.last() {
                      if last >= x {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  res.push(match st.last() {
                      Some(&v) => v,
                      None => -1,
                  });
                  st.push(x);
              }
              res
          }
        `,
        php: code`
          function prevSmaller($arr) {
              $st = [];
              $res = [];
              foreach ($arr as $x) {
                  while (!empty($st) && $st[count($st) - 1] >= $x) array_pop($st);
                  $res[] = empty($st) ? -1 : $st[count($st) - 1];
                  $st[] = $x;
              }
              return $res;
          }
        `,
        ruby: code`
          def prevSmaller(arr)
            st = []
            arr.map do |x|
              st.pop while !st.empty? && st[-1] >= x
              ans = st.empty? ? -1 : st[-1]
              st << x
              ans
            end
          end
        `,
      },
    };
  })(),

  // ── Maximum of Minimum for Every Window Size (GFG) ─────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const res = new Array(n).fill(-Infinity);
      for (let i = 0; i < n; i++) {
        let mn = Infinity;
        for (let j = i; j < n; j++) {
          mn = Math.min(mn, arr[j]);
          res[j - i] = Math.max(res[j - i], mn);
        }
      }
      return res;
    };
    return {
      slug: "maximum-of-minimum-for-every-window-size",
      title: "Maximum of Minimum for Every Window Size",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Monotonic Stack", "Sliding Window", "Amazon", "Flipkart", "Microsoft"],
      signature: { funcName: "maxOfMins", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "For every window size `k` from `1` to `n`, look at all `n - k + 1` contiguous windows of `arr` of that size, take the **minimum** of each window, and then the **maximum** of those minimums.\n\nReturn an array `res` of length `n` where `res[k - 1]` is that value for window size `k`.",
        [
          { in: "arr = [3,8,5,1,6]", out: "[8,5,3,1,1]", note: "Size 2: the windows' minimums are 3, 5, 1, 1 — the largest is 5. Size 3: 3, 1, 1 — the largest is 3." },
          { in: "arr = [4,4,4]", out: "[4,4,4]" },
          { in: "arr = [2,9,9,2,7]", out: "[9,9,2,2,2]" },
        ],
        ["1 <= arr.length <= 10^5", "1 <= arr[i] <= 10^6"]),
      hints: [
        "Turn it around: for each element, what is the largest window in which it is the minimum?",
        "That window stretches from just after the previous smaller element to just before the next smaller element — a monotonic stack gives both in O(n).",
        "If `arr[i]` is the minimum of a window of length `L`, it is a candidate for size `L` and also for every smaller size (shrink the window around it). Record the best per exact length, then sweep from long to short taking running maximums.",
      ],
      editorial: explain({
        idea: "Each element is the minimum of exactly one maximal window. Recording its value at that window's length, then propagating maximums from longer to shorter lengths, answers every size at once.",
        steps: [
          "With a monotonic stack compute `left[i]` (previous index with a smaller value, or -1) and `right[i]` (next index with a smaller-or-equal value, or `n`).",
          "The length `L = right[i] - left[i] - 1` window has `arr[i]` as its minimum; set `best[L] = max(best[L], arr[i])`.",
          "For `L` from `n - 1` down to `1`, set `best[L] = max(best[L], best[L + 1])`.",
          "Return `best[1..n]`.",
        ],
        why: "The answer for size `k` is some window minimum `arr[i]`. That element's maximal window has length `>= k`, and any length-`k` sub-window containing `i` still has minimum `arr[i]`, so the value is achievable for size `k` — which is what the backward sweep propagates. Conversely every recorded value is a real window minimum. With equal values, stopping at a smaller-or-equal element on the right only shortens the windows of earlier copies; the last copy still gets the full length.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The answers are non-increasing in `k`; forgetting the backward sweep leaves sizes that no element 'owns' at their initial value.",
          "Window length is `right - left - 1`, with the sentinels -1 and `n`.",
          "The brute-force O(n²) double loop is fine for small inputs but not for 10^5.",
        ],
      }),
      examples: [
        { input: "[3,8,5,1,6]", expectedOutput: "[8,5,3,1,1]" },
        { input: "[4,4,4]", expectedOutput: "[4,4,4]" },
        { input: "[2,9,9,2,7]", expectedOutput: "[9,9,2,2,2]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const hi = pick(rng, [3, 20, 1000000]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, hi));
        const shape = ri(rng, 0, 6);
        if (shape === 0) arr.sort((a, b) => a - b);
        else if (shape === 1) arr.sort((a, b) => b - a);
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxOfMins(arr: List[int]) -> List[int]:
              n = len(arr)
              left = [-1] * n
              right = [n] * n
              st = []
              for i in range(n):
                  while st and arr[st[-1]] >= arr[i]:
                      right[st.pop()] = i
                  left[i] = st[-1] if st else -1
                  st.append(i)
              best = [0] * (n + 2)
              for i in range(n):
                  length = right[i] - left[i] - 1
                  best[length] = max(best[length], arr[i])
              for length in range(n - 1, 0, -1):
                  best[length] = max(best[length], best[length + 1])
              return best[1:n + 1]
        `,
        javascript: code`
          var maxOfMins = function(arr) {
              var n = arr.length;
              var left = new Array(n).fill(-1), right = new Array(n).fill(n), st = [];
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && arr[st[st.length - 1]] >= arr[i]) right[st.pop()] = i;
                  left[i] = st.length > 0 ? st[st.length - 1] : -1;
                  st.push(i);
              }
              var best = new Array(n + 2).fill(0);
              for (var j = 0; j < n; j++) {
                  var len = right[j] - left[j] - 1;
                  if (arr[j] > best[len]) best[len] = arr[j];
              }
              for (var k = n - 1; k >= 1; k--) if (best[k + 1] > best[k]) best[k] = best[k + 1];
              return best.slice(1, n + 1);
          };
        `,
        typescript: code`
          function maxOfMins(arr: number[]): number[] {
              var n = arr.length;
              var left: number[] = [], right: number[] = [], st: number[] = [];
              for (var z = 0; z < n; z++) { left.push(-1); right.push(n); }
              for (var i = 0; i < n; i++) {
                  while (st.length > 0 && arr[st[st.length - 1]] >= arr[i]) right[st.pop() as number] = i;
                  left[i] = st.length > 0 ? st[st.length - 1] : -1;
                  st.push(i);
              }
              var best: number[] = [];
              for (var y = 0; y < n + 2; y++) best.push(0);
              for (var j = 0; j < n; j++) {
                  var len = right[j] - left[j] - 1;
                  if (arr[j] > best[len]) best[len] = arr[j];
              }
              for (var k = n - 1; k >= 1; k--) if (best[k + 1] > best[k]) best[k] = best[k + 1];
              return best.slice(1, n + 1);
          }
        `,
        java: code`
          public static int[] maxOfMins(int[] arr) {
              int n = arr.length;
              int[] left = new int[n], right = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++) {
                  right[i] = n;
                  while (top > 0 && arr[st[top - 1]] >= arr[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              int[] best = new int[n + 2];
              for (int i = 0; i < n; i++) {
                  int len = right[i] - left[i] - 1;
                  best[len] = Math.max(best[len], arr[i]);
              }
              for (int k = n - 1; k >= 1; k--) best[k] = Math.max(best[k], best[k + 1]);
              return Arrays.copyOfRange(best, 1, n + 1);
          }
        `,
        cpp: code`
          vector<int> maxOfMins(vector<int>& arr) {
              int n = arr.size();
              vector<int> left(n, -1), right(n, n), st;
              for (int i = 0; i < n; i++) {
                  while (!st.empty() && arr[st.back()] >= arr[i]) {
                      right[st.back()] = i;
                      st.pop_back();
                  }
                  left[i] = st.empty() ? -1 : st.back();
                  st.push_back(i);
              }
              vector<int> best(n + 2, 0);
              for (int i = 0; i < n; i++) {
                  int len = right[i] - left[i] - 1;
                  best[len] = max(best[len], arr[i]);
              }
              for (int k = n - 1; k >= 1; k--) best[k] = max(best[k], best[k + 1]);
              return vector<int>(best.begin() + 1, best.begin() + n + 1);
          }
        `,
        c: code`
          int* maxOfMins(int* arr, int arrSize, int* returnSize) {
              int n = arrSize;
              int* left = (int*)malloc(sizeof(int) * (n + 1));
              int* right = (int*)malloc(sizeof(int) * (n + 1));
              int* st = (int*)malloc(sizeof(int) * (n + 1));
              int* best = (int*)calloc(n + 2, sizeof(int));
              int top = 0;
              for (int i = 0; i < n; i++) {
                  right[i] = n;
                  while (top > 0 && arr[st[top - 1]] >= arr[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              for (int i = 0; i < n; i++) {
                  int len = right[i] - left[i] - 1;
                  if (arr[i] > best[len]) best[len] = arr[i];
              }
              for (int k = n - 1; k >= 1; k--) if (best[k + 1] > best[k]) best[k] = best[k + 1];
              int* res = (int*)malloc(sizeof(int) * (n + 1));
              for (int k = 1; k <= n; k++) res[k - 1] = best[k];
              free(left);
              free(right);
              free(st);
              free(best);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          public static int[] MaxOfMins(int[] arr)
          {
              int n = arr.Length;
              int[] left = new int[n], right = new int[n], st = new int[n];
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  right[i] = n;
                  while (top > 0 && arr[st[top - 1]] >= arr[i]) right[st[--top]] = i;
                  left[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = i;
              }
              int[] best = new int[n + 2];
              for (int i = 0; i < n; i++)
              {
                  int len = right[i] - left[i] - 1;
                  best[len] = Math.Max(best[len], arr[i]);
              }
              for (int k = n - 1; k >= 1; k--) best[k] = Math.Max(best[k], best[k + 1]);
              int[] res = new int[n];
              for (int k = 1; k <= n; k++) res[k - 1] = best[k];
              return res;
          }
        `,
        go: code`
          func maxOfMins(arr []int) []int {
              n := len(arr)
              left := make([]int, n)
              right := make([]int, n)
              st := []int{}
              for i := 0; i < n; i++ {
                  right[i] = n
                  for len(st) > 0 && arr[st[len(st)-1]] >= arr[i] {
                      right[st[len(st)-1]] = i
                      st = st[:len(st)-1]
                  }
                  if len(st) > 0 {
                      left[i] = st[len(st)-1]
                  } else {
                      left[i] = -1
                  }
                  st = append(st, i)
              }
              best := make([]int, n+2)
              for i := 0; i < n; i++ {
                  l := right[i] - left[i] - 1
                  if arr[i] > best[l] {
                      best[l] = arr[i]
                  }
              }
              for k := n - 1; k >= 1; k-- {
                  if best[k+1] > best[k] {
                      best[k] = best[k+1]
                  }
              }
              return best[1 : n+1]
          }
        `,
        kotlin: code`
          fun maxOfMins(arr: IntArray): IntArray {
              val n = arr.size
              val left = IntArray(n)
              val right = IntArray(n) { n }
              val st = IntArray(n)
              var top = 0
              for (i in 0 until n) {
                  while (top > 0 && arr[st[top - 1]] >= arr[i]) {
                      top--
                      right[st[top]] = i
                  }
                  left[i] = if (top > 0) st[top - 1] else -1
                  st[top++] = i
              }
              val best = IntArray(n + 2)
              for (i in 0 until n) {
                  val len = right[i] - left[i] - 1
                  best[len] = maxOf(best[len], arr[i])
              }
              for (k in n - 1 downTo 1) best[k] = maxOf(best[k], best[k + 1])
              return IntArray(n) { best[it + 1] }
          }
        `,
        swift: code`
          func maxOfMins(_ arr: [Int]) -> [Int] {
              let n = arr.count
              var left = [Int](repeating: -1, count: n)
              var right = [Int](repeating: n, count: n)
              var st = [Int]()
              for i in 0..<n {
                  while let top = st.last, arr[top] >= arr[i] {
                      right[top] = i
                      st.removeLast()
                  }
                  left[i] = st.last ?? -1
                  st.append(i)
              }
              var best = [Int](repeating: 0, count: n + 2)
              for i in 0..<n {
                  let len = right[i] - left[i] - 1
                  best[len] = max(best[len], arr[i])
              }
              var k = n - 1
              while k >= 1 {
                  best[k] = max(best[k], best[k + 1])
                  k -= 1
              }
              return Array(best[1...n])
          }
        `,
        rust: code`
          fn maxOfMins(arr: Vec<i32>) -> Vec<i32> {
              let n = arr.len();
              let mut left: Vec<usize> = vec![0; n];
              let mut right: Vec<usize> = vec![n; n];
              let mut st: Vec<usize> = Vec::new();
              for i in 0..n {
                  while let Some(&top) = st.last() {
                      if arr[top] >= arr[i] {
                          right[top] = i;
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  // left[i] is the first index of the window
                  left[i] = match st.last() {
                      Some(&t) => t + 1,
                      None => 0,
                  };
                  st.push(i);
              }
              let mut best = vec![0i32; n + 2];
              for i in 0..n {
                  let len = right[i] - left[i];
                  if arr[i] > best[len] {
                      best[len] = arr[i];
                  }
              }
              for k in (1..n).rev() {
                  if best[k + 1] > best[k] {
                      best[k] = best[k + 1];
                  }
              }
              best[1..n + 1].to_vec()
          }
        `,
        php: code`
          function maxOfMins($arr) {
              $n = count($arr);
              $left = array_fill(0, $n, -1);
              $right = array_fill(0, $n, $n);
              $st = [];
              for ($i = 0; $i < $n; $i++) {
                  while (!empty($st) && $arr[$st[count($st) - 1]] >= $arr[$i]) {
                      $right[array_pop($st)] = $i;
                  }
                  $left[$i] = empty($st) ? -1 : $st[count($st) - 1];
                  $st[] = $i;
              }
              $best = array_fill(0, $n + 2, 0);
              for ($i = 0; $i < $n; $i++) {
                  $len = $right[$i] - $left[$i] - 1;
                  if ($arr[$i] > $best[$len]) $best[$len] = $arr[$i];
              }
              for ($k = $n - 1; $k >= 1; $k--) {
                  if ($best[$k + 1] > $best[$k]) $best[$k] = $best[$k + 1];
              }
              return array_slice($best, 1, $n);
          }
        `,
        ruby: code`
          def maxOfMins(arr)
            n = arr.length
            left = Array.new(n, -1)
            right = Array.new(n, n)
            st = []
            n.times do |i|
              right[st.pop] = i while !st.empty? && arr[st[-1]] >= arr[i]
              left[i] = st.empty? ? -1 : st[-1]
              st << i
            end
            best = Array.new(n + 2, 0)
            n.times do |i|
              len = right[i] - left[i] - 1
              best[len] = arr[i] if arr[i] > best[len]
            end
            (n - 1).downto(1) { |k| best[k] = best[k + 1] if best[k + 1] > best[k] }
            best[1, n]
          end
        `,
      },
    };
  })(),

  // ── The Celebrity Problem (GFG) ────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const n = mat.length;
      for (let c = 0; c < n; c++) {
        let ok = true;
        for (let i = 0; i < n && ok; i++) {
          if (i === c) continue;
          if (mat[c][i] === 1 || mat[i][c] === 0) ok = false;
        }
        if (ok) return c;
      }
      return -1;
    };
    return {
      slug: "the-celebrity-problem",
      title: "The Celebrity Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Two Pointers", "Graph", "Amazon", "Google", "Microsoft", "Flipkart"],
      signature: { funcName: "celebrity", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "At a party of `n` people, numbered `0` to `n - 1`, the square matrix `mat` records who knows whom: `mat[i][j] = 1` means person `i` knows person `j`, and `0` means they do not. The diagonal `mat[i][i]` says nothing about anyone and must be ignored (it may hold 0 or 1).\n\nA **celebrity** is a person who is known by **everyone else** but knows **nobody else**. There is at most one celebrity. Return the celebrity's index, or `-1` if there is none.",
        [
          { in: "mat = [[0,1,0],[0,0,0],[0,1,0]]", out: "1", note: "Persons 0 and 2 both know person 1, and person 1 knows nobody." },
          { in: "mat = [[0,1],[1,0]]", out: "-1", note: "Each knows the other, so neither is a celebrity." },
          { in: "mat = [[1]]", out: "0", note: "Alone at the party, person 0 qualifies — the diagonal is ignored." },
        ],
        ["1 <= n <= 3000", "mat.length == mat[i].length == n", "mat[i][j] is 0 or 1"]),
      hints: [
        "Checking every person against everyone is O(n²). Can a single question rule somebody out?",
        "Ask whether `a` knows `b`. If yes, `a` is not the celebrity; if no, `b` is not. Each question eliminates one person.",
        "Narrow down to one candidate with two pointers (or a stack), then verify that candidate in O(n).",
      ],
      editorial: explain({
        idea: "Every 'does `a` know `b`?' query eliminates one of the two, so `n - 1` queries leave a single candidate; one O(n) check then confirms or rejects it.",
        steps: [
          "Set `a = 0`, `b = n - 1`.",
          "While `a < b`: if `mat[a][b] == 1`, `a` knows someone and cannot be the celebrity, so `a++`; otherwise `b` is not known by `a` and cannot be the celebrity, so `b--`.",
          "The candidate is `c = a`. For every `i != c`, require `mat[c][i] == 0` and `mat[i][c] == 1`.",
          "Return `c` if all checks pass, otherwise `-1`.",
        ],
        why: "Each comparison removes a person who provably is not the celebrity, and the range `[a, b]` always still contains the celebrity if one exists. So after the loop the only possible celebrity is `c`; the final scan checks the definition directly, which also handles the case where nobody qualifies.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The elimination only produces a *candidate* — skipping the verification returns a wrong index when there is no celebrity.",
          "Ignore the diagonal in the verification: `mat[c][c]` may be 1.",
          "Check both conditions: knows nobody (row is all 0) and is known by everyone (column is all 1).",
        ],
      }),
      examples: [
        { input: "[[0,1,0],[0,0,0],[0,1,0]]", expectedOutput: "1" },
        { input: "[[0,1],[1,0]]", expectedOutput: "-1" },
        { input: "[[1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 10]));
        const p = pick(rng, [0.2, 0.5, 0.8]);
        const mat = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        const mode = ri(rng, 0, 3);
        if (mode <= 1) {
          const c = ri(rng, 0, n - 1);
          for (let i = 0; i < n; i++) {
            if (i === c) continue;
            mat[c][i] = 0;
            mat[i][c] = 1;
          }
          if (mode === 1 && n > 1) {
            // break the celebrity with one violation
            let i = ri(rng, 0, n - 1);
            if (i === c) i = (i + 1) % n;
            if (rng() < 0.5) mat[c][i] = 1; else mat[i][c] = 0;
          }
        }
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: code`
          from typing import List

          def celebrity(mat: List[List[int]]) -> int:
              n = len(mat)
              a, b = 0, n - 1
              while a < b:
                  if mat[a][b] == 1:
                      a += 1
                  else:
                      b -= 1
              c = a
              for i in range(n):
                  if i != c and (mat[c][i] == 1 or mat[i][c] == 0):
                      return -1
              return c
        `,
        javascript: code`
          var celebrity = function(mat) {
              var n = mat.length;
              var a = 0, b = n - 1;
              while (a < b) {
                  if (mat[a][b] === 1) a++;
                  else b--;
              }
              for (var i = 0; i < n; i++) {
                  if (i !== a && (mat[a][i] === 1 || mat[i][a] === 0)) return -1;
              }
              return a;
          };
        `,
        typescript: code`
          function celebrity(mat: number[][]): number {
              var n = mat.length;
              var a = 0, b = n - 1;
              while (a < b) {
                  if (mat[a][b] === 1) a++;
                  else b--;
              }
              for (var i = 0; i < n; i++) {
                  if (i !== a && (mat[a][i] === 1 || mat[i][a] === 0)) return -1;
              }
              return a;
          }
        `,
        java: code`
          public static int celebrity(int[][] mat) {
              int n = mat.length;
              int a = 0, b = n - 1;
              while (a < b) {
                  if (mat[a][b] == 1) a++;
                  else b--;
              }
              for (int i = 0; i < n; i++) {
                  if (i != a && (mat[a][i] == 1 || mat[i][a] == 0)) return -1;
              }
              return a;
          }
        `,
        cpp: code`
          int celebrity(vector<vector<int>>& mat) {
              int n = mat.size();
              int a = 0, b = n - 1;
              while (a < b) {
                  if (mat[a][b] == 1) a++;
                  else b--;
              }
              for (int i = 0; i < n; i++) {
                  if (i != a && (mat[a][i] == 1 || mat[i][a] == 0)) return -1;
              }
              return a;
          }
        `,
        c: code`
          int celebrity(int** mat, int matSize, int* matColSize) {
              int n = matSize;
              int a = 0, b = n - 1;
              while (a < b) {
                  if (mat[a][b] == 1) a++;
                  else b--;
              }
              for (int i = 0; i < n; i++) {
                  if (i != a && (mat[a][i] == 1 || mat[i][a] == 0)) return -1;
              }
              return a;
          }
        `,
        csharp: code`
          public static int Celebrity(int[][] mat)
          {
              int n = mat.Length;
              int a = 0, b = n - 1;
              while (a < b)
              {
                  if (mat[a][b] == 1) a++;
                  else b--;
              }
              for (int i = 0; i < n; i++)
              {
                  if (i != a && (mat[a][i] == 1 || mat[i][a] == 0)) return -1;
              }
              return a;
          }
        `,
        go: code`
          func celebrity(mat [][]int) int {
              n := len(mat)
              a, b := 0, n-1
              for a < b {
                  if mat[a][b] == 1 {
                      a++
                  } else {
                      b--
                  }
              }
              for i := 0; i < n; i++ {
                  if i != a && (mat[a][i] == 1 || mat[i][a] == 0) {
                      return -1
                  }
              }
              return a
          }
        `,
        kotlin: code`
          fun celebrity(mat: Array<IntArray>): Int {
              val n = mat.size
              var a = 0
              var b = n - 1
              while (a < b) {
                  if (mat[a][b] == 1) a++ else b--
              }
              for (i in 0 until n) {
                  if (i != a && (mat[a][i] == 1 || mat[i][a] == 0)) return -1
              }
              return a
          }
        `,
        swift: code`
          func celebrity(_ mat: [[Int]]) -> Int {
              let n = mat.count
              var a = 0
              var b = n - 1
              while a < b {
                  if mat[a][b] == 1 { a += 1 } else { b -= 1 }
              }
              for i in 0..<n {
                  if i != a && (mat[a][i] == 1 || mat[i][a] == 0) { return -1 }
              }
              return a
          }
        `,
        rust: code`
          fn celebrity(mat: Vec<Vec<i32>>) -> i32 {
              let n = mat.len();
              let mut a = 0usize;
              let mut b = n - 1;
              while a < b {
                  if mat[a][b] == 1 {
                      a += 1;
                  } else {
                      b -= 1;
                  }
              }
              for i in 0..n {
                  if i != a && (mat[a][i] == 1 || mat[i][a] == 0) {
                      return -1;
                  }
              }
              a as i32
          }
        `,
        php: code`
          function celebrity($mat) {
              $n = count($mat);
              $a = 0;
              $b = $n - 1;
              while ($a < $b) {
                  if ($mat[$a][$b] == 1) $a++;
                  else $b--;
              }
              for ($i = 0; $i < $n; $i++) {
                  if ($i != $a && ($mat[$a][$i] == 1 || $mat[$i][$a] == 0)) return -1;
              }
              return $a;
          }
        `,
        ruby: code`
          def celebrity(mat)
            n = mat.length
            a = 0
            b = n - 1
            while a < b
              if mat[a][b] == 1
                a += 1
              else
                b -= 1
              end
            end
            n.times do |i|
              return -1 if i != a && (mat[a][i] == 1 || mat[i][a] == 0)
            end
            a
          end
        `,
      },
    };
  })(),

  // ── Next Greater Frequency Element (GFG) ───────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const freq = new Map<number, number>();
      for (const x of arr) freq.set(x, (freq.get(x) || 0) + 1);
      return arr.map((x, i) => {
        for (let j = i + 1; j < arr.length; j++) if (freq.get(arr[j])! > freq.get(x)!) return arr[j];
        return -1;
      });
    };
    return {
      slug: "next-greater-frequency-element",
      title: "Next Greater Frequency Element",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Stack", "Monotonic Stack", "Amazon", "Flipkart", "Paytm"],
      signature: { funcName: "nextGreaterFrequency", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "The **frequency** of a value is how many times it occurs in the whole array `arr`.\n\nFor every index `i`, find the nearest index `j > i` whose value occurs **strictly more often** in `arr` than `arr[i]` does, and report `arr[j]`. If no such index exists, report `-1`.\n\nReturn the array of reports.",
        [
          { in: "arr = [5,1,5,6,6,6]", out: "[6,5,6,-1,-1,-1]", note: "Frequencies: 5 → 2, 1 → 1, 6 → 3. For the 1 at index 1, the next value seen more often is the 5 at index 2." },
          { in: "arr = [4,4,4]", out: "[-1,-1,-1]" },
          { in: "arr = [7,3,3,9,7,7]", out: "[-1,7,7,7,-1,-1]", note: "7 is the most frequent value (3 times), so nothing beats it." },
        ],
        ["1 <= arr.length <= 10^5", "1 <= arr[i] <= 10^5"]),
      hints: [
        "First count every value's frequency; after that, the problem is 'next greater element' with frequencies in place of values.",
        "Walk from right to left. Which elements to your right can never be the answer for anything further left?",
        "Keep a stack of values whose frequencies strictly increase from top to bottom: pop every value whose frequency is `<=` the current one, report the top (or -1), then push the current value.",
      ],
      editorial: explain({
        idea: "With frequencies precomputed, each position asks for the next element of strictly higher frequency — the next-greater-element pattern, solved with a monotonic stack scanned from the right.",
        steps: [
          "Count the frequency of every value.",
          "Scan `i` from `n - 1` down to 0 with a stack of values.",
          "Pop while the top's frequency is `<=` the frequency of `arr[i]`.",
          "The answer for `i` is the top's value, or -1 if the stack is empty; then push `arr[i]`.",
        ],
        why: "A popped value at position `j > i` has frequency at most `freq(arr[i])`. Any position further left that would accept it (its own frequency below `freq(arr[j])`) would also accept `arr[i]`, which is nearer — so `j` is never needed again. The stack therefore holds exactly the possible answers, with the nearest one on top.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Compare frequencies, not values — but report the value.",
          "Strictly greater: an equal frequency does not count, so pop on `<=`.",
          "Frequencies are global, counted over the whole array, not over the suffix.",
        ],
      }),
      examples: [
        { input: "[5,1,5,6,6,6]", expectedOutput: "[6,5,6,-1,-1,-1]" },
        { input: "[4,4,4]", expectedOutput: "[-1,-1,-1]" },
        { input: "[7,3,3,9,7,7]", expectedOutput: "[-1,7,7,7,-1,-1]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const n = cls === 0 ? 1 : ri(rng, 2, cls < 5 ? 10 : 60);
        const distinct = ri(rng, 1, Math.max(1, Math.min(n, pick(rng, [2, 4, 8, 30]))));
        const palette = Array.from({ length: distinct }, () => ri(rng, 1, pick(rng, [10, 100000])));
        const arr = Array.from({ length: n }, () => pick(rng, palette));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def nextGreaterFrequency(arr: List[int]) -> List[int]:
              freq = Counter(arr)
              n = len(arr)
              res = [-1] * n
              st = []
              for i in range(n - 1, -1, -1):
                  f = freq[arr[i]]
                  while st and freq[st[-1]] <= f:
                      st.pop()
                  if st:
                      res[i] = st[-1]
                  st.append(arr[i])
              return res
        `,
        javascript: code`
          var nextGreaterFrequency = function(arr) {
              var n = arr.length;
              var freq = new Map();
              for (var i = 0; i < n; i++) freq.set(arr[i], (freq.get(arr[i]) || 0) + 1);
              var res = new Array(n).fill(-1);
              var st = [];
              for (var j = n - 1; j >= 0; j--) {
                  var f = freq.get(arr[j]);
                  while (st.length > 0 && freq.get(st[st.length - 1]) <= f) st.pop();
                  if (st.length > 0) res[j] = st[st.length - 1];
                  st.push(arr[j]);
              }
              return res;
          };
        `,
        typescript: code`
          function nextGreaterFrequency(arr: number[]): number[] {
              var n = arr.length;
              var freq: { [k: string]: number } = {};
              for (var i = 0; i < n; i++) {
                  var key = "" + arr[i];
                  freq[key] = (freq[key] === undefined ? 0 : freq[key]) + 1;
              }
              var res: number[] = [];
              for (var z = 0; z < n; z++) res.push(-1);
              var st: number[] = [];
              for (var j = n - 1; j >= 0; j--) {
                  var f = freq["" + arr[j]];
                  while (st.length > 0 && freq["" + st[st.length - 1]] <= f) st.pop();
                  if (st.length > 0) res[j] = st[st.length - 1];
                  st.push(arr[j]);
              }
              return res;
          }
        `,
        java: code`
          public static int[] nextGreaterFrequency(int[] arr) {
              int n = arr.length;
              Map<Integer, Integer> freq = new HashMap<>();
              for (int x : arr) freq.merge(x, 1, Integer::sum);
              int[] res = new int[n];
              int[] st = new int[n];
              int top = 0;
              for (int i = n - 1; i >= 0; i--) {
                  int f = freq.get(arr[i]);
                  while (top > 0 && freq.get(st[top - 1]) <= f) top--;
                  res[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = arr[i];
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> nextGreaterFrequency(vector<int>& arr) {
              int n = arr.size();
              unordered_map<int, int> freq;
              for (int x : arr) freq[x]++;
              vector<int> res(n, -1), st;
              for (int i = n - 1; i >= 0; i--) {
                  int f = freq[arr[i]];
                  while (!st.empty() && freq[st.back()] <= f) st.pop_back();
                  if (!st.empty()) res[i] = st.back();
                  st.push_back(arr[i]);
              }
              return res;
          }
        `,
        c: code`
          int* nextGreaterFrequency(int* arr, int arrSize, int* returnSize) {
              int n = arrSize;
              int* freq = (int*)calloc(100001, sizeof(int));
              for (int i = 0; i < n; i++) freq[arr[i]]++;
              int* res = (int*)malloc(sizeof(int) * (n + 1));
              int* st = (int*)malloc(sizeof(int) * (n + 1));
              int top = 0;
              for (int i = n - 1; i >= 0; i--) {
                  int f = freq[arr[i]];
                  while (top > 0 && freq[st[top - 1]] <= f) top--;
                  res[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = arr[i];
              }
              free(freq);
              free(st);
              *returnSize = n;
              return res;
          }
        `,
        csharp: code`
          public static int[] NextGreaterFrequency(int[] arr)
          {
              int n = arr.Length;
              var freq = new Dictionary<int, int>();
              foreach (int x in arr)
              {
                  freq.TryGetValue(x, out int c);
                  freq[x] = c + 1;
              }
              int[] res = new int[n];
              int[] st = new int[n];
              int top = 0;
              for (int i = n - 1; i >= 0; i--)
              {
                  int f = freq[arr[i]];
                  while (top > 0 && freq[st[top - 1]] <= f) top--;
                  res[i] = top > 0 ? st[top - 1] : -1;
                  st[top++] = arr[i];
              }
              return res;
          }
        `,
        go: code`
          func nextGreaterFrequency(arr []int) []int {
              n := len(arr)
              freq := map[int]int{}
              for _, x := range arr {
                  freq[x]++
              }
              res := make([]int, n)
              st := []int{}
              for i := n - 1; i >= 0; i-- {
                  f := freq[arr[i]]
                  for len(st) > 0 && freq[st[len(st)-1]] <= f {
                      st = st[:len(st)-1]
                  }
                  if len(st) > 0 {
                      res[i] = st[len(st)-1]
                  } else {
                      res[i] = -1
                  }
                  st = append(st, arr[i])
              }
              return res
          }
        `,
        kotlin: code`
          fun nextGreaterFrequency(arr: IntArray): IntArray {
              val n = arr.size
              val freq = HashMap<Int, Int>()
              for (x in arr) freq[x] = (freq[x] ?: 0) + 1
              val res = IntArray(n) { -1 }
              val st = IntArray(n)
              var top = 0
              for (i in n - 1 downTo 0) {
                  val f = freq[arr[i]]!!
                  while (top > 0 && freq[st[top - 1]]!! <= f) top--
                  if (top > 0) res[i] = st[top - 1]
                  st[top++] = arr[i]
              }
              return res
          }
        `,
        swift: code`
          func nextGreaterFrequency(_ arr: [Int]) -> [Int] {
              let n = arr.count
              var freq = [Int: Int]()
              for x in arr { freq[x, default: 0] += 1 }
              var res = [Int](repeating: -1, count: n)
              var st = [Int]()
              var i = n - 1
              while i >= 0 {
                  let f = freq[arr[i]]!
                  while let top = st.last, freq[top]! <= f { st.removeLast() }
                  if let top = st.last { res[i] = top }
                  st.append(arr[i])
                  i -= 1
              }
              return res
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn nextGreaterFrequency(arr: Vec<i32>) -> Vec<i32> {
              let n = arr.len();
              let mut freq: HashMap<i32, i32> = HashMap::new();
              for &x in arr.iter() {
                  *freq.entry(x).or_insert(0) += 1;
              }
              let mut res = vec![-1i32; n];
              let mut st: Vec<i32> = Vec::new();
              for i in (0..n).rev() {
                  let f = freq[&arr[i]];
                  while let Some(&top) = st.last() {
                      if freq[&top] <= f {
                          st.pop();
                      } else {
                          break;
                      }
                  }
                  if let Some(&top) = st.last() {
                      res[i] = top;
                  }
                  st.push(arr[i]);
              }
              res
          }
        `,
        php: code`
          function nextGreaterFrequency($arr) {
              $n = count($arr);
              $freq = [];
              foreach ($arr as $x) $freq[$x] = (isset($freq[$x]) ? $freq[$x] : 0) + 1;
              $res = array_fill(0, $n, -1);
              $st = [];
              for ($i = $n - 1; $i >= 0; $i--) {
                  $f = $freq[$arr[$i]];
                  while (!empty($st) && $freq[$st[count($st) - 1]] <= $f) array_pop($st);
                  if (!empty($st)) $res[$i] = $st[count($st) - 1];
                  $st[] = $arr[$i];
              }
              return $res;
          }
        `,
        ruby: code`
          def nextGreaterFrequency(arr)
            freq = Hash.new(0)
            arr.each { |x| freq[x] += 1 }
            n = arr.length
            res = Array.new(n, -1)
            st = []
            (n - 1).downto(0) do |i|
              f = freq[arr[i]]
              st.pop while !st.empty? && freq[st[-1]] <= f
              res[i] = st[-1] unless st.empty?
              st << arr[i]
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Infix to Postfix (GFG) ─────────────────────────────────────
  (() => {
    // Recursive-descent reference: expr := term (+|- term)*, term := factor (*|/ factor)*,
    // factor := primary (^ factor)?, primary := operand | ( expr ).
    const ref = (s: string) => {
      let i = 0;
      let out = "";
      const expr = (): void => {
        term();
        while (i < s.length && (s[i] === "+" || s[i] === "-")) { const op = s[i++]; term(); out += op; }
      };
      const term = (): void => {
        factor();
        while (i < s.length && (s[i] === "*" || s[i] === "/")) { const op = s[i++]; factor(); out += op; }
      };
      const factor = (): void => {
        primary();
        if (i < s.length && s[i] === "^") { i++; factor(); out += "^"; }
      };
      const primary = (): void => {
        if (s[i] === "(") { i++; expr(); i++; } else { out += s[i++]; }
      };
      expr();
      return out;
    };
    const OPERANDS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const build = (rng: Rng, depth: number): string => {
      if (depth === 0 || rng() < 0.3) return OPERANDS[ri(rng, 0, OPERANDS.length - 1)];
      const op = pick(rng, ["+", "-", "*", "/", "^", "+", "*"]);
      let left = build(rng, depth - 1), right = build(rng, depth - 1);
      if (rng() < 0.35) left = `(${left})`;
      if (rng() < 0.35) right = `(${right})`;
      return `${left}${op}${right}`;
    };
    return {
      slug: "infix-to-postfix",
      title: "Infix to Postfix",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Amazon", "Microsoft", "Samsung", "TCS"],
      signature: { funcName: "infixToPostfix", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Convert the infix expression `s` to **postfix** (reverse Polish) notation, where every operator follows its two operands.\n\nOperands are single characters — a letter or a digit. The operators are `+`, `-`, `*`, `/` and `^`, and parentheses group sub-expressions. Precedence, from highest: `^`, then `*` and `/`, then `+` and `-`. Operators of equal precedence group **left to right**, except `^`, which groups **right to left** (`a^b^c` means `a^(b^c)`).\n\nReturn the postfix expression as a string with no spaces; parentheses never appear in it.",
        [
          { in: "s = \"a+b*c\"", out: '"abc*+"' },
          { in: "s = \"(A-B)/C+D^E^F\"", out: '"AB-C/DEF^^+"', note: "`^` is right-associative, so `D^E^F` becomes `DEF^^`." },
          { in: "s = \"x-y-z\"", out: '"xy-z-"', note: "`-` is left-associative: `(x-y)-z`." },
        ],
        [
          "1 <= s.length <= 10^5",
          "s is a valid infix expression of single-character operands (letters or digits), the operators + - * / ^ and parentheses",
          "s contains no spaces",
        ]),
      hints: [
        "Operands go straight to the output in the order they appear; only the operators need reordering.",
        "Hold operators on a stack. Before pushing a new operator, which operators already on the stack must be emitted first?",
        "Pop operators with higher precedence, and those with equal precedence when the new operator is left-associative (not `^`); stop at `(`. A `)` pops until its `(`.",
      ],
      editorial: explain({
        idea: "The shunting-yard algorithm: operands stream to the output, operators wait on a stack until an operator of lower precedence (or a closing parenthesis) proves they must be applied first.",
        steps: [
          "Scan `s`. An operand is appended to the output.",
          "`(` is pushed. `)` pops operators to the output until the matching `(`, which is discarded.",
          "For an operator `o`, pop to the output while the top is an operator with higher precedence than `o`, or equal precedence and `o` is left-associative. Then push `o`.",
          "At the end, pop every remaining operator to the output.",
        ],
        why: "An operator on the stack is emitted exactly when its right operand is complete: a following operator of lower precedence (or equal, for left-associative ones) cannot bind tighter, so the stacked operator's sub-expression ends there. For `^`, an equal-precedence `^` binds tighter (right-associativity), so the stacked one must wait. Parentheses act as a fence that makes the inner expression complete at `)`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Treating `^` as left-associative turns `a^b^c` into `ab^c^`.",
          "Never pop past a `(` when handling an operator.",
          "Remember to flush the stack at the end of the input.",
        ],
      }),
      examples: [
        { input: "\"a+b*c\"", expectedOutput: "abc*+" },
        { input: "\"(A-B)/C+D^E^F\"", expectedOutput: "AB-C/DEF^^+" },
        { input: "\"x-y-z\"", expectedOutput: "xy-z-" },
      ],
      gen: (rng: Rng) => {
        let s = build(rng, ri(rng, 0, pick(rng, [2, 4, 5])));
        if (rng() < 0.15) s = `(${s})`;
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def infixToPostfix(s: str) -> str:
              prec = {'+': 1, '-': 1, '*': 2, '/': 2, '^': 3}
              out = []
              st = []
              for c in s:
                  if c.isalnum():
                      out.append(c)
                  elif c == '(':
                      st.append(c)
                  elif c == ')':
                      while st[-1] != '(':
                          out.append(st.pop())
                      st.pop()
                  else:
                      while st and st[-1] != '(' and (prec[st[-1]] > prec[c] or (prec[st[-1]] == prec[c] and c != '^')):
                          out.append(st.pop())
                      st.append(c)
              while st:
                  out.append(st.pop())
              return ''.join(out)
        `,
        javascript: code`
          var infixToPostfix = function(s) {
              var prec = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };
              var out = [], st = [];
              for (var i = 0; i < s.length; i++) {
                  var c = s[i];
                  if (/[A-Za-z0-9]/.test(c)) {
                      out.push(c);
                  } else if (c === "(") {
                      st.push(c);
                  } else if (c === ")") {
                      while (st[st.length - 1] !== "(") out.push(st.pop());
                      st.pop();
                  } else {
                      while (st.length > 0 && st[st.length - 1] !== "(") {
                          var top = st[st.length - 1];
                          if (prec[top] > prec[c] || (prec[top] === prec[c] && c !== "^")) out.push(st.pop());
                          else break;
                      }
                      st.push(c);
                  }
              }
              while (st.length > 0) out.push(st.pop());
              return out.join("");
          };
        `,
        typescript: code`
          function precOf(c: string): number {
              if (c === "^") return 3;
              if (c === "*" || c === "/") return 2;
              if (c === "+" || c === "-") return 1;
              return 0;
          }

          function infixToPostfix(s: string): string {
              var out: string[] = [], st: string[] = [];
              for (var i = 0; i < s.length; i++) {
                  var c = s.charAt(i);
                  if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || (c >= "0" && c <= "9")) {
                      out.push(c);
                  } else if (c === "(") {
                      st.push(c);
                  } else if (c === ")") {
                      while (st[st.length - 1] !== "(") out.push(st.pop() as string);
                      st.pop();
                  } else {
                      while (st.length > 0 && st[st.length - 1] !== "(") {
                          var top = st[st.length - 1];
                          if (precOf(top) > precOf(c) || (precOf(top) === precOf(c) && c !== "^")) out.push(st.pop() as string);
                          else break;
                      }
                      st.push(c);
                  }
              }
              while (st.length > 0) out.push(st.pop() as string);
              return out.join("");
          }
        `,
        java: code`
          private static int precOf(char c) {
              if (c == '^') return 3;
              if (c == '*' || c == '/') return 2;
              if (c == '+' || c == '-') return 1;
              return 0;
          }

          public static String infixToPostfix(String s) {
              StringBuilder out = new StringBuilder();
              char[] st = new char[s.length() + 1];
              int top = 0;
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (Character.isLetterOrDigit(c)) {
                      out.append(c);
                  } else if (c == '(') {
                      st[top++] = c;
                  } else if (c == ')') {
                      while (st[top - 1] != '(') out.append(st[--top]);
                      top--;
                  } else {
                      while (top > 0 && st[top - 1] != '(' && (precOf(st[top - 1]) > precOf(c) || (precOf(st[top - 1]) == precOf(c) && c != '^'))) {
                          out.append(st[--top]);
                      }
                      st[top++] = c;
                  }
              }
              while (top > 0) out.append(st[--top]);
              return out.toString();
          }
        `,
        cpp: code`
          int precOf(char c) {
              if (c == '^') return 3;
              if (c == '*' || c == '/') return 2;
              if (c == '+' || c == '-') return 1;
              return 0;
          }

          string infixToPostfix(string s) {
              string out;
              vector<char> st;
              for (char c : s) {
                  if (isalnum((unsigned char)c)) {
                      out += c;
                  } else if (c == '(') {
                      st.push_back(c);
                  } else if (c == ')') {
                      while (st.back() != '(') { out += st.back(); st.pop_back(); }
                      st.pop_back();
                  } else {
                      while (!st.empty() && st.back() != '(' && (precOf(st.back()) > precOf(c) || (precOf(st.back()) == precOf(c) && c != '^'))) {
                          out += st.back();
                          st.pop_back();
                      }
                      st.push_back(c);
                  }
              }
              while (!st.empty()) { out += st.back(); st.pop_back(); }
              return out;
          }
        `,
        c: code`
          static int precOf(char c) {
              if (c == '^') return 3;
              if (c == '*' || c == '/') return 2;
              if (c == '+' || c == '-') return 1;
              return 0;
          }

          char* infixToPostfix(const char* s) {
              int n = (int)strlen(s);
              char* out = (char*)malloc(n + 1);
              char* st = (char*)malloc(n + 1);
              int len = 0, top = 0;
              for (int i = 0; i < n; i++) {
                  char c = s[i];
                  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) {
                      out[len++] = c;
                  } else if (c == '(') {
                      st[top++] = c;
                  } else if (c == ')') {
                      while (st[top - 1] != '(') out[len++] = st[--top];
                      top--;
                  } else {
                      while (top > 0 && st[top - 1] != '(' && (precOf(st[top - 1]) > precOf(c) || (precOf(st[top - 1]) == precOf(c) && c != '^'))) {
                          out[len++] = st[--top];
                      }
                      st[top++] = c;
                  }
              }
              while (top > 0) out[len++] = st[--top];
              out[len] = '\0';
              free(st);
              return out;
          }
        `,
        csharp: code`
          private static int PrecOf(char c)
          {
              if (c == '^') return 3;
              if (c == '*' || c == '/') return 2;
              if (c == '+' || c == '-') return 1;
              return 0;
          }

          public static string InfixToPostfix(string s)
          {
              var output = new System.Text.StringBuilder();
              var st = new Stack<char>();
              foreach (char c in s)
              {
                  if (char.IsLetterOrDigit(c))
                  {
                      output.Append(c);
                  }
                  else if (c == '(')
                  {
                      st.Push(c);
                  }
                  else if (c == ')')
                  {
                      while (st.Peek() != '(') output.Append(st.Pop());
                      st.Pop();
                  }
                  else
                  {
                      while (st.Count > 0 && st.Peek() != '(' && (PrecOf(st.Peek()) > PrecOf(c) || (PrecOf(st.Peek()) == PrecOf(c) && c != '^')))
                      {
                          output.Append(st.Pop());
                      }
                      st.Push(c);
                  }
              }
              while (st.Count > 0) output.Append(st.Pop());
              return output.ToString();
          }
        `,
        go: code`
          func precOf(c byte) int {
              switch c {
              case '^':
                  return 3
              case '*', '/':
                  return 2
              case '+', '-':
                  return 1
              }
              return 0
          }

          func infixToPostfix(s string) string {
              out := []byte{}
              st := []byte{}
              for i := 0; i < len(s); i++ {
                  c := s[i]
                  if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') {
                      out = append(out, c)
                  } else if c == '(' {
                      st = append(st, c)
                  } else if c == ')' {
                      for st[len(st)-1] != '(' {
                          out = append(out, st[len(st)-1])
                          st = st[:len(st)-1]
                      }
                      st = st[:len(st)-1]
                  } else {
                      for len(st) > 0 && st[len(st)-1] != '(' && (precOf(st[len(st)-1]) > precOf(c) || (precOf(st[len(st)-1]) == precOf(c) && c != '^')) {
                          out = append(out, st[len(st)-1])
                          st = st[:len(st)-1]
                      }
                      st = append(st, c)
                  }
              }
              for len(st) > 0 {
                  out = append(out, st[len(st)-1])
                  st = st[:len(st)-1]
              }
              return string(out)
          }
        `,
        kotlin: code`
          fun precOf(c: Char): Int = when (c) {
              '^' -> 3
              '*', '/' -> 2
              '+', '-' -> 1
              else -> 0
          }

          fun infixToPostfix(s: String): String {
              val out = StringBuilder()
              val st = java.util.ArrayDeque<Char>()
              for (c in s) {
                  if (c.isLetterOrDigit()) {
                      out.append(c)
                  } else if (c == '(') {
                      st.push(c)
                  } else if (c == ')') {
                      while (st.peek() != '(') out.append(st.pop())
                      st.pop()
                  } else {
                      while (st.isNotEmpty() && st.peek() != '(' && (precOf(st.peek()) > precOf(c) || (precOf(st.peek()) == precOf(c) && c != '^'))) {
                          out.append(st.pop())
                      }
                      st.push(c)
                  }
              }
              while (st.isNotEmpty()) out.append(st.pop())
              return out.toString()
          }
        `,
        swift: code`
          func precOf(_ c: Character) -> Int {
              if c == "^" { return 3 }
              if c == "*" || c == "/" { return 2 }
              if c == "+" || c == "-" { return 1 }
              return 0
          }

          func infixToPostfix(_ s: String) -> String {
              var out = ""
              var st = [Character]()
              for c in s {
                  if c.isLetter || c.isNumber {
                      out.append(c)
                  } else if c == "(" {
                      st.append(c)
                  } else if c == ")" {
                      while st[st.count - 1] != "(" { out.append(st.removeLast()) }
                      st.removeLast()
                  } else {
                      while let top = st.last, top != "(", precOf(top) > precOf(c) || (precOf(top) == precOf(c) && c != "^") {
                          out.append(st.removeLast())
                      }
                      st.append(c)
                  }
              }
              while !st.isEmpty { out.append(st.removeLast()) }
              return out
          }
        `,
        rust: code`
          fn prec_of(c: u8) -> i32 {
              match c {
                  b'^' => 3,
                  b'*' | b'/' => 2,
                  b'+' | b'-' => 1,
                  _ => 0,
              }
          }

          fn infixToPostfix(s: String) -> String {
              let mut out: Vec<u8> = Vec::new();
              let mut st: Vec<u8> = Vec::new();
              for &c in s.as_bytes().iter() {
                  if c.is_ascii_alphanumeric() {
                      out.push(c);
                  } else if c == b'(' {
                      st.push(c);
                  } else if c == b')' {
                      while let Some(top) = st.pop() {
                          if top == b'(' {
                              break;
                          }
                          out.push(top);
                      }
                  } else {
                      while let Some(&top) = st.last() {
                          if top != b'(' && (prec_of(top) > prec_of(c) || (prec_of(top) == prec_of(c) && c != b'^')) {
                              out.push(top);
                              st.pop();
                          } else {
                              break;
                          }
                      }
                      st.push(c);
                  }
              }
              while let Some(top) = st.pop() {
                  out.push(top);
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function precOf($c) {
              if ($c === '^') return 3;
              if ($c === '*' || $c === '/') return 2;
              if ($c === '+' || $c === '-') return 1;
              return 0;
          }

          function infixToPostfix($s) {
              $out = '';
              $st = [];
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $c = $s[$i];
                  $o = ord($c);
                  if (($o >= 97 && $o <= 122) || ($o >= 65 && $o <= 90) || ($o >= 48 && $o <= 57)) {
                      $out .= $c;
                  } elseif ($c === '(') {
                      $st[] = $c;
                  } elseif ($c === ')') {
                      while ($st[count($st) - 1] !== '(') $out .= array_pop($st);
                      array_pop($st);
                  } else {
                      while (!empty($st) && $st[count($st) - 1] !== '(') {
                          $top = $st[count($st) - 1];
                          if (precOf($top) > precOf($c) || (precOf($top) == precOf($c) && $c !== '^')) $out .= array_pop($st);
                          else break;
                      }
                      $st[] = $c;
                  }
              }
              while (!empty($st)) $out .= array_pop($st);
              return $out;
          }
        `,
        ruby: code`
          def infixToPostfix(s)
            prec = { '+' => 1, '-' => 1, '*' => 2, '/' => 2, '^' => 3 }
            out = +''
            st = []
            s.each_char do |c|
              if c =~ /[A-Za-z0-9]/
                out << c
              elsif c == '('
                st << c
              elsif c == ')'
                out << st.pop while st[-1] != '('
                st.pop
              else
                while !st.empty? && st[-1] != '(' && (prec[st[-1]] > prec[c] || (prec[st[-1]] == prec[c] && c != '^'))
                  out << st.pop
                end
                st << c
              end
            end
            out << st.pop until st.empty?
            out
          end
        `,
      },
    };
  })(),

  // ── Basic Calculator (LC 224) ──────────────────────────────────
  (() => {
    type Built = { s: string; v: number };
    const genExpr = (rng: Rng, depth: number, maxNum: number): Built => {
      const terms = ri(rng, 1, 4);
      let s = "", v = 0;
      for (let t = 0; t < terms; t++) {
        const term = genTerm(rng, depth, maxNum);
        if (t === 0) {
          const neg = rng() < 0.25;
          s = (neg ? "-" : "") + term.s;
          v = neg ? -term.v : term.v;
        } else {
          const plus = rng() < 0.5;
          s += (plus ? "+" : "-") + term.s;
          v += plus ? term.v : -term.v;
        }
      }
      return { s, v };
    };
    const genTerm = (rng: Rng, depth: number, maxNum: number): Built => {
      if (depth === 0 || rng() < 0.45) {
        const x = ri(rng, 0, maxNum);
        return { s: String(x), v: x };
      }
      const e = genExpr(rng, depth - 1, maxNum);
      return { s: `(${e.s})`, v: e.v };
    };
    const spaced = (rng: Rng, s: string, p: number) => {
      let out = rng() < p ? " " : "";
      for (let i = 0; i < s.length; i++) {
        out += s[i];
        const bothDigits = i + 1 < s.length && /[0-9]/.test(s[i]) && /[0-9]/.test(s[i + 1]);
        if (!bothDigits && rng() < p) out += " ";
      }
      return out;
    };
    // Independent check of the generated value: a recursive-descent evaluator.
    const evaluate = (src: string) => {
      const s = src.replace(/ /g, "");
      let i = 0;
      const expr = (): number => {
        let v: number;
        if (s[i] === "-") { i++; v = -term(); } else v = term();
        while (i < s.length && (s[i] === "+" || s[i] === "-")) {
          const op = s[i++];
          const t = term();
          v = op === "+" ? v + t : v - t;
        }
        return v;
      };
      const term = (): number => {
        if (s[i] === "(") { i++; const v = expr(); i++; return v; }
        let x = 0;
        while (i < s.length && s[i] >= "0" && s[i] <= "9") x = x * 10 + (s.charCodeAt(i++) - 48);
        return x;
      };
      return expr();
    };
    return {
      slug: "basic-calculator",
      title: "Basic Calculator",
      difficulty: "HARD" as const,
      tags: ["Math", "String", "Stack", "Recursion", "Google", "Amazon", "Meta", "Microsoft"],
      signature: { funcName: "calculate", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Evaluate the arithmetic expression `s` and return its value. Do not use any built-in function that evaluates strings as code.\n\n`s` contains non-negative integers, the operators `+` and `-`, parentheses `(` `)`, and spaces (which mean nothing). `-` may also be used as a **unary** minus — at the very start of the expression or right after `(`, as in `-5` or `-(2 + 3)` — but `+` is never unary, and two operators never appear next to each other.",
        [
          { in: "s = \"7 - (3 + 2)\"", out: "2" },
          { in: "s = \"-(4 - 10) + 1\"", out: "7", note: "The unary minus negates the whole bracket: -(-6) + 1." },
          { in: "s = \"(12+(3-(5+1)))-(20)\"", out: "-11" },
        ],
        [
          "1 <= s.length <= 3 * 10^5",
          "s consists of digits, '+', '-', '(', ')' and ' '",
          "s is a valid expression",
          "Every number and every intermediate result fits in a signed 32-bit integer",
        ]),
      hints: [
        "Without parentheses the answer is just a running sum: each number is added with the sign in front of it.",
        "A parenthesised group is its own running sum, which is then added to the outer sum with the sign in front of the `(`.",
        "On `(`, push the current result and sign onto a stack and start fresh; on `)`, finish the inner sum and combine: `result = savedResult + savedSign * result`.",
      ],
      editorial: explain({
        idea: "With only `+` and `-`, an expression is a signed sum. Parentheses nest sums, so keep a stack of the outer `(result, sign)` pairs that are waiting for an inner sum to finish.",
        steps: [
          "Keep `result = 0`, `sign = 1`, `num = 0` and an empty stack. Skip spaces.",
          "Digit: `num = num * 10 + digit`.",
          "`+` or `-`: add `sign * num` to `result`, reset `num`, and set `sign` to `+1` or `-1`.",
          "`(`: push `result` and `sign`, then reset `result = 0`, `sign = 1`.",
          "`)`: add `sign * num` to `result`, reset `num`, pop the saved sign and result, and set `result = savedResult + savedSign * result`.",
          "At the end return `result + sign * num`.",
        ],
        why: "Between parentheses the algorithm maintains the invariant `value so far = result + sign * num`. A `(` suspends the outer sum exactly as it stood, including the sign that applies to the whole group, so the inner sum can be computed from scratch and then folded in with that sign. A unary minus needs no special case: at the start of a group `result` is 0, so `-x` is evaluated as `0 - x`.",
        time: "O(n)",
        space: "O(n) for the stack of nested groups",
        pitfalls: [
          "Numbers have several digits — accumulate them instead of reading one character.",
          "Flush the pending number before handling `)` and at the end of the string.",
          "A unary minus before `(` must negate the whole group, which the saved sign handles automatically.",
        ],
      }),
      examples: [
        { input: "\"7 - (3 + 2)\"", expectedOutput: "2" },
        { input: "\"-(4 - 10) + 1\"", expectedOutput: "7" },
        { input: "\"(12+(3-(5+1)))-(20)\"", expectedOutput: "-11" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.1;
        const built = big ? genExpr(rng, 0, 500000000) : genExpr(rng, ri(rng, 0, 3), pick(rng, [9, 1000]));
        const s = spaced(rng, built.s, pick(rng, [0, 0.2, 0.5]));
        const v = evaluate(s);
        if (v !== built.v) throw new Error(`basic-calculator generator disagrees on ${s}`);
        return { input: `"${s}"`, expectedOutput: String(v) };
      },
      solutions: {
        python: code`
          def calculate(s: str) -> int:
              result = 0
              sign = 1
              num = 0
              st = []
              for c in s:
                  if c.isdigit():
                      num = num * 10 + int(c)
                  elif c == '+' or c == '-':
                      result += sign * num
                      num = 0
                      sign = 1 if c == '+' else -1
                  elif c == '(':
                      st.append(result)
                      st.append(sign)
                      result = 0
                      sign = 1
                  elif c == ')':
                      result += sign * num
                      num = 0
                      saved_sign = st.pop()
                      saved_result = st.pop()
                      result = saved_result + saved_sign * result
              return result + sign * num
        `,
        javascript: code`
          var calculate = function(s) {
              var result = 0, sign = 1, num = 0, st = [];
              for (var i = 0; i < s.length; i++) {
                  var c = s[i];
                  if (c >= "0" && c <= "9") {
                      num = num * 10 + (c.charCodeAt(0) - 48);
                  } else if (c === "+" || c === "-") {
                      result += sign * num;
                      num = 0;
                      sign = c === "+" ? 1 : -1;
                  } else if (c === "(") {
                      st.push(result, sign);
                      result = 0;
                      sign = 1;
                  } else if (c === ")") {
                      result += sign * num;
                      num = 0;
                      var savedSign = st.pop();
                      var savedResult = st.pop();
                      result = savedResult + savedSign * result;
                  }
              }
              return result + sign * num;
          };
        `,
        typescript: code`
          function calculate(s: string): number {
              var result = 0, sign = 1, num = 0;
              var st: number[] = [];
              for (var i = 0; i < s.length; i++) {
                  var c = s.charAt(i);
                  if (c >= "0" && c <= "9") {
                      num = num * 10 + (s.charCodeAt(i) - 48);
                  } else if (c === "+" || c === "-") {
                      result += sign * num;
                      num = 0;
                      sign = c === "+" ? 1 : -1;
                  } else if (c === "(") {
                      st.push(result);
                      st.push(sign);
                      result = 0;
                      sign = 1;
                  } else if (c === ")") {
                      result += sign * num;
                      num = 0;
                      var savedSign = st.pop() as number;
                      var savedResult = st.pop() as number;
                      result = savedResult + savedSign * result;
                  }
              }
              return result + sign * num;
          }
        `,
        java: code`
          public static int calculate(String s) {
              long result = 0, num = 0;
              int sign = 1;
              Deque<Long> st = new ArrayDeque<>();
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c >= '0' && c <= '9') {
                      num = num * 10 + (c - '0');
                  } else if (c == '+' || c == '-') {
                      result += sign * num;
                      num = 0;
                      sign = c == '+' ? 1 : -1;
                  } else if (c == '(') {
                      st.push(result);
                      st.push((long) sign);
                      result = 0;
                      sign = 1;
                  } else if (c == ')') {
                      result += sign * num;
                      num = 0;
                      long savedSign = st.pop();
                      long savedResult = st.pop();
                      result = savedResult + savedSign * result;
                  }
              }
              return (int) (result + sign * num);
          }
        `,
        cpp: code`
          int calculate(string s) {
              long long result = 0, num = 0;
              int sign = 1;
              vector<long long> st;
              for (char c : s) {
                  if (c >= '0' && c <= '9') {
                      num = num * 10 + (c - '0');
                  } else if (c == '+' || c == '-') {
                      result += sign * num;
                      num = 0;
                      sign = c == '+' ? 1 : -1;
                  } else if (c == '(') {
                      st.push_back(result);
                      st.push_back(sign);
                      result = 0;
                      sign = 1;
                  } else if (c == ')') {
                      result += sign * num;
                      num = 0;
                      long long savedSign = st.back(); st.pop_back();
                      long long savedResult = st.back(); st.pop_back();
                      result = savedResult + savedSign * result;
                  }
              }
              return (int)(result + sign * num);
          }
        `,
        c: code`
          int calculate(const char* s) {
              int n = (int)strlen(s);
              long long* st = (long long*)malloc(sizeof(long long) * (n + 2));
              int top = 0;
              long long result = 0, num = 0;
              int sign = 1;
              for (int i = 0; i < n; i++) {
                  char c = s[i];
                  if (c >= '0' && c <= '9') {
                      num = num * 10 + (c - '0');
                  } else if (c == '+' || c == '-') {
                      result += sign * num;
                      num = 0;
                      sign = c == '+' ? 1 : -1;
                  } else if (c == '(') {
                      st[top++] = result;
                      st[top++] = sign;
                      result = 0;
                      sign = 1;
                  } else if (c == ')') {
                      result += sign * num;
                      num = 0;
                      long long savedSign = st[--top];
                      long long savedResult = st[--top];
                      result = savedResult + savedSign * result;
                  }
              }
              free(st);
              return (int)(result + sign * num);
          }
        `,
        csharp: code`
          public static int Calculate(string s)
          {
              long result = 0, num = 0;
              int sign = 1;
              var st = new Stack<long>();
              foreach (char c in s)
              {
                  if (c >= '0' && c <= '9')
                  {
                      num = num * 10 + (c - '0');
                  }
                  else if (c == '+' || c == '-')
                  {
                      result += sign * num;
                      num = 0;
                      sign = c == '+' ? 1 : -1;
                  }
                  else if (c == '(')
                  {
                      st.Push(result);
                      st.Push(sign);
                      result = 0;
                      sign = 1;
                  }
                  else if (c == ')')
                  {
                      result += sign * num;
                      num = 0;
                      long savedSign = st.Pop();
                      long savedResult = st.Pop();
                      result = savedResult + savedSign * result;
                  }
              }
              return (int)(result + sign * num);
          }
        `,
        go: code`
          func calculate(s string) int {
              result, num, sign := 0, 0, 1
              st := []int{}
              for i := 0; i < len(s); i++ {
                  c := s[i]
                  if c >= '0' && c <= '9' {
                      num = num*10 + int(c-'0')
                  } else if c == '+' || c == '-' {
                      result += sign * num
                      num = 0
                      if c == '+' {
                          sign = 1
                      } else {
                          sign = -1
                      }
                  } else if c == '(' {
                      st = append(st, result, sign)
                      result = 0
                      sign = 1
                  } else if c == ')' {
                      result += sign * num
                      num = 0
                      savedSign := st[len(st)-1]
                      savedResult := st[len(st)-2]
                      st = st[:len(st)-2]
                      result = savedResult + savedSign*result
                  }
              }
              return result + sign*num
          }
        `,
        kotlin: code`
          fun calculate(s: String): Int {
              var result = 0L
              var num = 0L
              var sign = 1
              val st = java.util.ArrayDeque<Long>()
              for (c in s) {
                  if (c in '0'..'9') {
                      num = num * 10 + (c - '0')
                  } else if (c == '+' || c == '-') {
                      result += sign * num
                      num = 0
                      sign = if (c == '+') 1 else -1
                  } else if (c == '(') {
                      st.push(result)
                      st.push(sign.toLong())
                      result = 0
                      sign = 1
                  } else if (c == ')') {
                      result += sign * num
                      num = 0
                      val savedSign = st.pop()
                      val savedResult = st.pop()
                      result = savedResult + savedSign * result
                  }
              }
              return (result + sign * num).toInt()
          }
        `,
        swift: code`
          func calculate(_ s: String) -> Int {
              var result = 0
              var num = 0
              var sign = 1
              var st = [Int]()
              for c in s.utf8 {
                  if c >= 48 && c <= 57 {
                      num = num * 10 + Int(c - 48)
                  } else if c == 43 || c == 45 {
                      result += sign * num
                      num = 0
                      sign = c == 43 ? 1 : -1
                  } else if c == 40 {
                      st.append(result)
                      st.append(sign)
                      result = 0
                      sign = 1
                  } else if c == 41 {
                      result += sign * num
                      num = 0
                      let savedSign = st.removeLast()
                      let savedResult = st.removeLast()
                      result = savedResult + savedSign * result
                  }
              }
              return result + sign * num
          }
        `,
        rust: code`
          fn calculate(s: String) -> i32 {
              let mut result: i64 = 0;
              let mut num: i64 = 0;
              let mut sign: i64 = 1;
              let mut st: Vec<i64> = Vec::new();
              for &c in s.as_bytes().iter() {
                  if c >= b'0' && c <= b'9' {
                      num = num * 10 + (c - b'0') as i64;
                  } else if c == b'+' || c == b'-' {
                      result += sign * num;
                      num = 0;
                      sign = if c == b'+' { 1 } else { -1 };
                  } else if c == b'(' {
                      st.push(result);
                      st.push(sign);
                      result = 0;
                      sign = 1;
                  } else if c == b')' {
                      result += sign * num;
                      num = 0;
                      let saved_sign = st.pop().unwrap();
                      let saved_result = st.pop().unwrap();
                      result = saved_result + saved_sign * result;
                  }
              }
              (result + sign * num) as i32
          }
        `,
        php: code`
          function calculate($s) {
              $result = 0;
              $num = 0;
              $sign = 1;
              $st = [];
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $c = $s[$i];
                  $o = ord($c);
                  if ($o >= 48 && $o <= 57) {
                      $num = $num * 10 + ($o - 48);
                  } elseif ($c === '+' || $c === '-') {
                      $result += $sign * $num;
                      $num = 0;
                      $sign = $c === '+' ? 1 : -1;
                  } elseif ($c === '(') {
                      $st[] = $result;
                      $st[] = $sign;
                      $result = 0;
                      $sign = 1;
                  } elseif ($c === ')') {
                      $result += $sign * $num;
                      $num = 0;
                      $savedSign = array_pop($st);
                      $savedResult = array_pop($st);
                      $result = $savedResult + $savedSign * $result;
                  }
              }
              return $result + $sign * $num;
          }
        `,
        ruby: code`
          def calculate(s)
            result = 0
            num = 0
            sign = 1
            st = []
            s.each_char do |c|
              if c >= '0' && c <= '9'
                num = num * 10 + c.ord - 48
              elsif c == '+' || c == '-'
                result += sign * num
                num = 0
                sign = c == '+' ? 1 : -1
              elsif c == '('
                st << result << sign
                result = 0
                sign = 1
              elsif c == ')'
                result += sign * num
                num = 0
                saved_sign = st.pop
                saved_result = st.pop
                result = saved_result + saved_sign * result
              end
            end
            result + sign * num
          end
        `,
      },
    };
  })(),

  // ── Number of Atoms (LC 726) ───────────────────────────────────
  (() => {
    type Atom = { kind: "el"; name: string; cnt: number } | { kind: "grp"; items: Atom[]; cnt: number };
    const NAMES = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "K", "Ca", "Fe", "Cu", "Zn", "Ag", "Au", "Hg", "Pb", "U", "I"];
    const genName = (rng: Rng) => {
      if (rng() < 0.8) return pick(rng, NAMES);
      let s = String.fromCharCode(65 + ri(rng, 0, 25));
      const extra = ri(rng, 0, 2);
      for (let i = 0; i < extra; i++) s += String.fromCharCode(97 + ri(rng, 0, 25));
      return s;
    };
    const genCnt = (rng: Rng) => (rng() < 0.5 ? 1 : ri(rng, 2, pick(rng, [9, 30])));
    const genItems = (rng: Rng, depth: number, maxItems: number): Atom[] =>
      Array.from({ length: ri(rng, 1, maxItems) }, () =>
        depth > 0 && rng() < 0.35
          ? { kind: "grp" as const, items: genItems(rng, depth - 1, 3), cnt: genCnt(rng) }
          : { kind: "el" as const, name: genName(rng), cnt: genCnt(rng) });
    const show = (a: Atom): string =>
      (a.kind === "el" ? a.name : `(${a.items.map(show).join("")})`) + (a.cnt > 1 ? String(a.cnt) : "");
    const tally = (a: Atom, mult: number, into: Map<string, number>) => {
      if (a.kind === "el") into.set(a.name, (into.get(a.name) || 0) + a.cnt * mult);
      else for (const it of a.items) tally(it, mult * a.cnt, into);
    };
    const render = (counts: Map<string, number>) =>
      Array.from(counts.keys()).sort().map((k) => k + (counts.get(k)! > 1 ? String(counts.get(k)) : "")).join("");
    return {
      slug: "number-of-atoms",
      title: "Number of Atoms",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "String", "Stack", "Sorting", "Google", "Amazon", "Apple"],
      signature: { funcName: "countOfAtoms", params: [{ name: "formula", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A chemical `formula` is built from these pieces:\n\n- An **atom** name: one uppercase letter followed by zero or more lowercase letters, such as `H`, `Mg` or `Zn`.\n- An optional **count** right after an atom: a number of at least 2 (a count of 1 is never written). `H2O` has two hydrogen atoms and one oxygen atom.\n- Formulas can be **concatenated** (`H2O2He3Mg4`) or wrapped in parentheses with an optional count that multiplies everything inside (`(H2O2)3`).\n\nReturn the number of atoms of each element as a string: the element names in **sorted** (lexicographic, by character code) order, each followed by its count if that count is more than 1.",
        [
          { in: "formula = \"C6H12O6\"", out: "C6H12O6" },
          { in: "formula = \"Fe2(SO4)3\"", out: "Fe2O12S3", note: "The group SO4 is tripled: 3 sulfur and 12 oxygen atoms." },
          { in: "formula = \"(NH4)3PO4\"", out: "H12N3O4P" },
        ],
        [
          "1 <= formula.length <= 1000",
          "formula consists of English letters, digits, '(' and ')'",
          "formula is always valid",
          "Every count in the answer fits in a 32-bit integer",
        ]),
      hints: [
        "A count after `)` multiplies every atom inside that group, and groups can nest.",
        "Reading the formula from right to left, you see each multiplier *before* the atoms it applies to.",
        "Scan right to left with a stack of multipliers: digits build a pending number; `)` pushes `top × number`; `(` pops; an uppercase letter ends an atom name — add `top × number` to its count. Sort the names at the end.",
      ],
      editorial: explain({
        idea: "Scan the formula backwards. Then every count is met before what it multiplies, so a stack of cumulative multipliers gives each atom's factor directly — no recursion needed.",
        steps: [
          "Keep a stack of multipliers starting with `[1]`, a pending number `num` (built digit by digit from the right), and a map from atom name to count.",
          "Digit: prepend it to `num`.",
          "`)`: push `top × (num or 1)` and clear `num`. `(`: pop.",
          "Uppercase letter at `i`: the atom name runs from `i` through the lowercase letters after it. Add `top × (num or 1)` to its count and clear `num`. Lowercase letters themselves are skipped — they are read with their uppercase letter.",
          "Sort the names and write each with its count when the count exceeds 1.",
        ],
        why: "Right to left, an atom's own count is the number just read, and the groups enclosing it are exactly those whose `)` has been seen but whose `(` has not — the ones on the stack. Each stack entry already holds the product of all enclosing group counts, so the top is the total multiplier.",
        time: "O(n + k log k) for k distinct atoms",
        space: "O(n)",
        pitfalls: [
          "Counts can have several digits — when scanning backwards, build them with a place value, not by appending.",
          "A missing count means 1, both for atoms and for groups.",
          "Sort by character code: `C` comes before `Ca`, and every uppercase letter before every lowercase one.",
        ],
      }),
      examples: [
        { input: "\"C6H12O6\"", expectedOutput: "C6H12O6" },
        { input: "\"Fe2(SO4)3\"", expectedOutput: "Fe2O12S3" },
        { input: "\"(NH4)3PO4\"", expectedOutput: "H12N3O4P" },
      ],
      gen: (rng: Rng) => {
        const items = genItems(rng, ri(rng, 0, 3), 4);
        const formula = items.map(show).join("");
        const counts = new Map<string, number>();
        for (const it of items) tally(it, 1, counts);
        return { input: `"${formula}"`, expectedOutput: render(counts) };
      },
      solutions: {
        python: code`
          def countOfAtoms(formula: str) -> str:
              n = len(formula)
              counts = {}
              mult = [1]
              num = 0
              place = 1
              for i in range(n - 1, -1, -1):
                  c = formula[i]
                  if c.isdigit():
                      num += (ord(c) - 48) * place
                      place *= 10
                  elif c == ')':
                      mult.append(mult[-1] * (num if place > 1 else 1))
                      num, place = 0, 1
                  elif c == '(':
                      mult.pop()
                  elif c.isupper():
                      j = i + 1
                      while j < n and formula[j].islower():
                          j += 1
                      name = formula[i:j]
                      counts[name] = counts.get(name, 0) + mult[-1] * (num if place > 1 else 1)
                      num, place = 0, 1
              return ''.join(name + (str(counts[name]) if counts[name] > 1 else '') for name in sorted(counts))
        `,
        javascript: code`
          var countOfAtoms = function(formula) {
              var n = formula.length;
              var counts = new Map();
              var mult = [1];
              var num = 0, place = 1;
              for (var i = n - 1; i >= 0; i--) {
                  var c = formula[i];
                  if (c >= "0" && c <= "9") {
                      num += (c.charCodeAt(0) - 48) * place;
                      place *= 10;
                  } else if (c === ")") {
                      mult.push(mult[mult.length - 1] * (place > 1 ? num : 1));
                      num = 0;
                      place = 1;
                  } else if (c === "(") {
                      mult.pop();
                  } else if (c >= "A" && c <= "Z") {
                      var j = i + 1;
                      while (j < n && formula[j] >= "a" && formula[j] <= "z") j++;
                      var name = formula.slice(i, j);
                      var add = mult[mult.length - 1] * (place > 1 ? num : 1);
                      counts.set(name, (counts.get(name) || 0) + add);
                      num = 0;
                      place = 1;
                  }
              }
              var names = Array.from(counts.keys()).sort();
              var out = "";
              for (var k = 0; k < names.length; k++) {
                  var cnt = counts.get(names[k]);
                  out += names[k] + (cnt > 1 ? String(cnt) : "");
              }
              return out;
          };
        `,
        typescript: code`
          function countOfAtoms(formula: string): string {
              var n = formula.length;
              var counts: { [k: string]: number } = {};
              var keys: string[] = [];
              var mult: number[] = [1];
              var num = 0, place = 1;
              for (var i = n - 1; i >= 0; i--) {
                  var c = formula.charAt(i);
                  if (c >= "0" && c <= "9") {
                      num += (formula.charCodeAt(i) - 48) * place;
                      place *= 10;
                  } else if (c === ")") {
                      mult.push(mult[mult.length - 1] * (place > 1 ? num : 1));
                      num = 0;
                      place = 1;
                  } else if (c === "(") {
                      mult.pop();
                  } else if (c >= "A" && c <= "Z") {
                      var j = i + 1;
                      while (j < n && formula.charAt(j) >= "a" && formula.charAt(j) <= "z") j++;
                      var key = "#" + formula.substring(i, j);
                      if (counts[key] === undefined) { counts[key] = 0; keys.push(key); }
                      counts[key] += mult[mult.length - 1] * (place > 1 ? num : 1);
                      num = 0;
                      place = 1;
                  }
              }
              keys.sort();
              var out = "";
              for (var k = 0; k < keys.length; k++) {
                  out += keys[k].substring(1) + (counts[keys[k]] > 1 ? String(counts[keys[k]]) : "");
              }
              return out;
          }
        `,
        java: code`
          public static String countOfAtoms(String formula) {
              int n = formula.length();
              TreeMap<String, Long> counts = new TreeMap<>();
              long[] mult = new long[n + 2];
              int top = 0;
              mult[top++] = 1;
              long num = 0, place = 1;
              for (int i = n - 1; i >= 0; i--) {
                  char c = formula.charAt(i);
                  if (c >= '0' && c <= '9') {
                      num += (c - '0') * place;
                      place *= 10;
                  } else if (c == ')') {
                      mult[top] = mult[top - 1] * (place > 1 ? num : 1);
                      top++;
                      num = 0;
                      place = 1;
                  } else if (c == '(') {
                      top--;
                  } else if (c >= 'A' && c <= 'Z') {
                      int j = i + 1;
                      while (j < n && formula.charAt(j) >= 'a' && formula.charAt(j) <= 'z') j++;
                      String name = formula.substring(i, j);
                      counts.merge(name, mult[top - 1] * (place > 1 ? num : 1), Long::sum);
                      num = 0;
                      place = 1;
                  }
              }
              StringBuilder sb = new StringBuilder();
              for (Map.Entry<String, Long> e : counts.entrySet()) {
                  sb.append(e.getKey());
                  if (e.getValue() > 1) sb.append(e.getValue());
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string countOfAtoms(string formula) {
              int n = formula.size();
              map<string, long long> counts;
              vector<long long> mult(1, 1);
              long long num = 0, place = 1;
              for (int i = n - 1; i >= 0; i--) {
                  char c = formula[i];
                  if (c >= '0' && c <= '9') {
                      num += (c - '0') * place;
                      place *= 10;
                  } else if (c == ')') {
                      mult.push_back(mult.back() * (place > 1 ? num : 1));
                      num = 0;
                      place = 1;
                  } else if (c == '(') {
                      mult.pop_back();
                  } else if (c >= 'A' && c <= 'Z') {
                      int j = i + 1;
                      while (j < n && formula[j] >= 'a' && formula[j] <= 'z') j++;
                      counts[formula.substr(i, j - i)] += mult.back() * (place > 1 ? num : 1);
                      num = 0;
                      place = 1;
                  }
              }
              string out;
              for (auto& e : counts) {
                  out += e.first;
                  if (e.second > 1) out += to_string(e.second);
              }
              return out;
          }
        `,
        c: code`
          typedef struct {
              char* name;
              long long cnt;
          } AtomEntry;

          static int cmpAtomEntry(const void* a, const void* b) {
              return strcmp(((const AtomEntry*)a)->name, ((const AtomEntry*)b)->name);
          }

          char* countOfAtoms(const char* formula) {
              int n = (int)strlen(formula);
              AtomEntry* entries = (AtomEntry*)malloc(sizeof(AtomEntry) * (n + 1));
              long long* mult = (long long*)malloc(sizeof(long long) * (n + 2));
              int m = 0, top = 0;
              mult[top++] = 1;
              long long num = 0, place = 1;
              for (int i = n - 1; i >= 0; i--) {
                  char c = formula[i];
                  if (c >= '0' && c <= '9') {
                      num += (c - '0') * place;
                      place *= 10;
                  } else if (c == ')') {
                      mult[top] = mult[top - 1] * (place > 1 ? num : 1);
                      top++;
                      num = 0;
                      place = 1;
                  } else if (c == '(') {
                      top--;
                  } else if (c >= 'A' && c <= 'Z') {
                      int j = i + 1;
                      while (j < n && formula[j] >= 'a' && formula[j] <= 'z') j++;
                      char* name = (char*)malloc(j - i + 1);
                      memcpy(name, formula + i, j - i);
                      name[j - i] = '\0';
                      entries[m].name = name;
                      entries[m].cnt = mult[top - 1] * (place > 1 ? num : 1);
                      m++;
                      num = 0;
                      place = 1;
                  }
              }
              qsort(entries, m, sizeof(AtomEntry), cmpAtomEntry);
              char* out = (char*)malloc((size_t)n * 12 + 16);
              int len = 0, k = 0;
              while (k < m) {
                  long long total = 0;
                  int e = k;
                  while (e < m && strcmp(entries[e].name, entries[k].name) == 0) {
                      total += entries[e].cnt;
                      e++;
                  }
                  int nl = (int)strlen(entries[k].name);
                  memcpy(out + len, entries[k].name, nl);
                  len += nl;
                  if (total > 1) len += sprintf(out + len, "%lld", total);
                  k = e;
              }
              out[len] = '\0';
              for (int t = 0; t < m; t++) free(entries[t].name);
              free(entries);
              free(mult);
              return out;
          }
        `,
        csharp: code`
          public static string CountOfAtoms(string formula)
          {
              int n = formula.Length;
              var counts = new SortedDictionary<string, long>(StringComparer.Ordinal);
              var mult = new List<long> { 1 };
              long num = 0, place = 1;
              for (int i = n - 1; i >= 0; i--)
              {
                  char c = formula[i];
                  if (c >= '0' && c <= '9')
                  {
                      num += (c - '0') * place;
                      place *= 10;
                  }
                  else if (c == ')')
                  {
                      mult.Add(mult[mult.Count - 1] * (place > 1 ? num : 1));
                      num = 0;
                      place = 1;
                  }
                  else if (c == '(')
                  {
                      mult.RemoveAt(mult.Count - 1);
                  }
                  else if (c >= 'A' && c <= 'Z')
                  {
                      int j = i + 1;
                      while (j < n && formula[j] >= 'a' && formula[j] <= 'z') j++;
                      string name = formula.Substring(i, j - i);
                      counts.TryGetValue(name, out long have);
                      counts[name] = have + mult[mult.Count - 1] * (place > 1 ? num : 1);
                      num = 0;
                      place = 1;
                  }
              }
              var sb = new System.Text.StringBuilder();
              foreach (var e in counts)
              {
                  sb.Append(e.Key);
                  if (e.Value > 1) sb.Append(e.Value);
              }
              return sb.ToString();
          }
        `,
        go: code`
          func countOfAtoms(formula string) string {
              n := len(formula)
              counts := map[string]int{}
              mult := []int{1}
              num, place := 0, 1
              for i := n - 1; i >= 0; i-- {
                  c := formula[i]
                  if c >= '0' && c <= '9' {
                      num += int(c-'0') * place
                      place *= 10
                  } else if c == ')' {
                      k := 1
                      if place > 1 {
                          k = num
                      }
                      mult = append(mult, mult[len(mult)-1]*k)
                      num, place = 0, 1
                  } else if c == '(' {
                      mult = mult[:len(mult)-1]
                  } else if c >= 'A' && c <= 'Z' {
                      j := i + 1
                      for j < n && formula[j] >= 'a' && formula[j] <= 'z' {
                          j++
                      }
                      k := 1
                      if place > 1 {
                          k = num
                      }
                      counts[formula[i:j]] += mult[len(mult)-1] * k
                      num, place = 0, 1
                  }
              }
              names := make([]string, 0, len(counts))
              for name := range counts {
                  names = append(names, name)
              }
              sort.Strings(names)
              var sb strings.Builder
              for _, name := range names {
                  sb.WriteString(name)
                  if counts[name] > 1 {
                      sb.WriteString(strconv.Itoa(counts[name]))
                  }
              }
              return sb.String()
          }
        `,
        kotlin: code`
          fun countOfAtoms(formula: String): String {
              val n = formula.length
              val counts = java.util.TreeMap<String, Long>()
              val mult = ArrayList<Long>()
              mult.add(1L)
              var num = 0L
              var place = 1L
              for (i in n - 1 downTo 0) {
                  val c = formula[i]
                  if (c in '0'..'9') {
                      num += (c - '0') * place
                      place *= 10
                  } else if (c == ')') {
                      mult.add(mult[mult.size - 1] * (if (place > 1) num else 1L))
                      num = 0L
                      place = 1L
                  } else if (c == '(') {
                      mult.removeAt(mult.size - 1)
                  } else if (c in 'A'..'Z') {
                      var j = i + 1
                      while (j < n && formula[j] in 'a'..'z') j++
                      val name = formula.substring(i, j)
                      counts[name] = (counts[name] ?: 0L) + mult[mult.size - 1] * (if (place > 1) num else 1L)
                      num = 0L
                      place = 1L
                  }
              }
              val sb = StringBuilder()
              for ((name, cnt) in counts) {
                  sb.append(name)
                  if (cnt > 1) sb.append(cnt)
              }
              return sb.toString()
          }
        `,
        swift: code`
          func countOfAtoms(_ formula: String) -> String {
              let s = Array(formula.utf8)
              let n = s.count
              var counts = [String: Int]()
              var mult = [1]
              var num = 0
              var place = 1
              var i = n - 1
              while i >= 0 {
                  let c = s[i]
                  if c >= 48 && c <= 57 {
                      num += Int(c - 48) * place
                      place *= 10
                  } else if c == 41 {
                      mult.append(mult[mult.count - 1] * (place > 1 ? num : 1))
                      num = 0
                      place = 1
                  } else if c == 40 {
                      mult.removeLast()
                  } else if c >= 65 && c <= 90 {
                      var j = i + 1
                      while j < n && s[j] >= 97 && s[j] <= 122 { j += 1 }
                      let name = String(decoding: s[i..<j], as: UTF8.self)
                      counts[name, default: 0] += mult[mult.count - 1] * (place > 1 ? num : 1)
                      num = 0
                      place = 1
                  }
                  i -= 1
              }
              var out = ""
              for name in counts.keys.sorted() {
                  out += name
                  if counts[name]! > 1 { out += String(counts[name]!) }
              }
              return out
          }
        `,
        rust: code`
          use std::collections::BTreeMap;

          fn countOfAtoms(formula: String) -> String {
              let s = formula.as_bytes();
              let n = s.len();
              let mut counts: BTreeMap<String, i64> = BTreeMap::new();
              let mut mult: Vec<i64> = vec![1];
              let mut num: i64 = 0;
              let mut place: i64 = 1;
              for i in (0..n).rev() {
                  let c = s[i];
                  if c >= b'0' && c <= b'9' {
                      num += (c - b'0') as i64 * place;
                      place *= 10;
                  } else if c == b')' {
                      let k = if place > 1 { num } else { 1 };
                      let top = *mult.last().unwrap();
                      mult.push(top * k);
                      num = 0;
                      place = 1;
                  } else if c == b'(' {
                      mult.pop();
                  } else if c >= b'A' && c <= b'Z' {
                      let mut j = i + 1;
                      while j < n && s[j] >= b'a' && s[j] <= b'z' {
                          j += 1;
                      }
                      let name = String::from_utf8(s[i..j].to_vec()).unwrap();
                      let k = if place > 1 { num } else { 1 };
                      let top = *mult.last().unwrap();
                      *counts.entry(name).or_insert(0) += top * k;
                      num = 0;
                      place = 1;
                  }
              }
              let mut out = String::new();
              for (name, &cnt) in counts.iter() {
                  out.push_str(name);
                  if cnt > 1 {
                      out.push_str(&cnt.to_string());
                  }
              }
              out
          }
        `,
        php: code`
          function countOfAtoms($formula) {
              $n = strlen($formula);
              $counts = [];
              $mult = [1];
              $num = 0;
              $place = 1;
              for ($i = $n - 1; $i >= 0; $i--) {
                  $o = ord($formula[$i]);
                  if ($o >= 48 && $o <= 57) {
                      $num += ($o - 48) * $place;
                      $place *= 10;
                  } elseif ($o == 41) {
                      $mult[] = $mult[count($mult) - 1] * ($place > 1 ? $num : 1);
                      $num = 0;
                      $place = 1;
                  } elseif ($o == 40) {
                      array_pop($mult);
                  } elseif ($o >= 65 && $o <= 90) {
                      $j = $i + 1;
                      while ($j < $n && ord($formula[$j]) >= 97 && ord($formula[$j]) <= 122) $j++;
                      $name = substr($formula, $i, $j - $i);
                      $add = $mult[count($mult) - 1] * ($place > 1 ? $num : 1);
                      $counts[$name] = (isset($counts[$name]) ? $counts[$name] : 0) + $add;
                      $num = 0;
                      $place = 1;
                  }
              }
              ksort($counts, SORT_STRING);
              $out = '';
              foreach ($counts as $name => $cnt) {
                  $out .= $name;
                  if ($cnt > 1) $out .= (string)$cnt;
              }
              return $out;
          }
        `,
        ruby: code`
          def countOfAtoms(formula)
            n = formula.length
            counts = Hash.new(0)
            mult = [1]
            num = 0
            place = 1
            (n - 1).downto(0) do |i|
              c = formula[i]
              if c >= '0' && c <= '9'
                num += (c.ord - 48) * place
                place *= 10
              elsif c == ')'
                mult << mult[-1] * (place > 1 ? num : 1)
                num = 0
                place = 1
              elsif c == '('
                mult.pop
              elsif c >= 'A' && c <= 'Z'
                j = i + 1
                j += 1 while j < n && formula[j] >= 'a' && formula[j] <= 'z'
                counts[formula[i...j]] += mult[-1] * (place > 1 ? num : 1)
                num = 0
                place = 1
              end
            end
            counts.keys.sort.map { |name| counts[name] > 1 ? name + counts[name].to_s : name }.join
          end
        `,
      },
    };
  })(),

  // ── Brace Expansion II (LC 1096) ───────────────────────────────
  (() => {
    type Brace = { kind: "ch"; c: string } | { kind: "union"; kids: Brace[] } | { kind: "cat"; kids: Brace[] };
    const genBrace = (rng: Rng, depth: number, alphabet: string): Brace => {
      if (depth === 0 || rng() < 0.3) return { kind: "ch", c: alphabet[ri(rng, 0, alphabet.length - 1)] };
      const kids = Array.from({ length: ri(rng, 2, 3) }, () => genBrace(rng, depth - 1, alphabet));
      return rng() < 0.5 ? { kind: "union", kids } : { kind: "cat", kids };
    };
    const showBrace = (b: Brace): string =>
      b.kind === "ch" ? b.c : b.kind === "union" ? `{${b.kids.map(showBrace).join(",")}}` : b.kids.map(showBrace).join("");
    const words = (b: Brace): Set<string> => {
      if (b.kind === "ch") return new Set([b.c]);
      if (b.kind === "union") {
        const out = new Set<string>();
        for (const k of b.kids) for (const w of words(k)) out.add(w);
        return out;
      }
      let acc = new Set<string>([""]);
      for (const k of b.kids) {
        const next = new Set<string>();
        const part = words(k);
        for (const a of acc) for (const w of part) next.add(a + w);
        acc = next;
      }
      return acc;
    };
    return {
      slug: "brace-expansion-ii",
      title: "Brace Expansion II",
      difficulty: "HARD" as const,
      tags: ["String", "Stack", "Backtracking", "Breadth-First Search", "Google", "Amazon"],
      signature: { funcName: "braceExpansionII", params: [{ name: "expression", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "An expression describes a **set** of lowercase words. Write `R(e)` for the set that expression `e` stands for. The grammar has three rules:\n\n- A single lowercase letter `x` stands for the set with one word: `R(\"a\") = {\"a\"}`.\n- A comma-separated list of two or more expressions inside braces stands for the **union** of their sets: `R(\"{a,b,c}\") = {\"a\",\"b\",\"c\"}` and `R(\"{{a,b},{b,c}}\") = {\"a\",\"b\",\"c\"}`.\n- Two expressions written next to each other stand for every **concatenation** of a word from the first with a word from the second: `R(\"{a,b}{c,d}\") = {\"ac\",\"ad\",\"bc\",\"bd\"}` and `R(\"a{b,c}{d,e}f\")` has 4 words.\n\nGiven `expression`, return the words of `R(expression)` with no duplicates, in sorted (lexicographic) order.",
        [
          { in: "expression = \"{c,k}{o,{d,e}}\"", out: "[\"cd\",\"ce\",\"co\",\"kd\",\"ke\",\"ko\"]" },
          { in: "expression = \"{{a,b},a{x,y},{ab,z}}\"", out: "[\"a\",\"ab\",\"ax\",\"ay\",\"b\",\"z\"]", note: "Duplicates such as the second `a` disappear in the union." },
          { in: "expression = \"k{ai,i}ro\"", out: "[\"kairo\",\"kiro\"]" },
        ],
        [
          "1 <= expression.length <= 60",
          "expression[i] is '{', '}', ',' or a lowercase English letter",
          "expression follows the grammar above",
        ]),
      hints: [
        "There are two operators: union (`,`) and concatenation (adjacency). Concatenation binds tighter, like `*` over `+`.",
        "Parse with two mutually recursive functions: one reads a comma-separated union, the other reads a run of adjacent items, each item being a letter or a braced union.",
        "Represent each partial result as a set of strings: union merges sets, concatenation forms the cartesian product. Sort the final set.",
      ],
      editorial: explain({
        idea: "The grammar is an expression language with two operators — union and concatenation — so a small recursive-descent parser that evaluates each sub-expression to a set of words solves it directly.",
        steps: [
          "`parseUnion`: read one concatenation; while the next character is `,`, skip it and union in another concatenation.",
          "`parseConcat`: start with the set `{\"\"}`. While the next character is neither `,` nor `}` nor the end: if it is `{`, skip it, read a `parseUnion`, and skip the `}`; otherwise take the single letter. Replace the accumulated set by the cartesian product with that item.",
          "Evaluate the whole string with `parseUnion`, then sort the words.",
        ],
        why: "`parseConcat` stops exactly at the characters that end a concatenation (`,` belongs to the enclosing union, `}` to the enclosing brace), so each function consumes precisely the text of the rule it implements, mirroring the grammar's precedence. Using sets at every level removes duplicates as soon as they arise, so the result is the set `R(expression)`.",
        time: "O(L · W) roughly, where W is the number of words produced (bounded by the 60-character input)",
        space: "O(W · L)",
        pitfalls: [
          "Concatenation binds tighter than the comma: `{a,b}c` inside braces is `{a, bc}`, not `{ac, bc}`.",
          "Deduplicate — the same word can be produced by different branches.",
          "Sort the output; set iteration order is arbitrary in most languages.",
        ],
      }),
      examples: [
        { input: "\"{c,k}{o,{d,e}}\"", expectedOutput: "[\"cd\",\"ce\",\"co\",\"kd\",\"ke\",\"ko\"]" },
        { input: "\"{{a,b},a{x,y},{ab,z}}\"", expectedOutput: "[\"a\",\"ab\",\"ax\",\"ay\",\"b\",\"z\"]" },
        { input: "\"k{ai,i}ro\"", expectedOutput: "[\"kairo\",\"kiro\"]" },
      ],
      gen: (rng: Rng) => {
        const alphabet = pick(rng, ["ab", "abc", "abcde", "codekairo"]);
        for (;;) {
          const b = genBrace(rng, ri(rng, 0, 4), alphabet);
          const s = showBrace(b);
          const w = Array.from(words(b)).sort();
          if (s.length <= 60 && w.length <= 24) return { input: `"${s}"`, expectedOutput: fmtStrArr(w) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def braceExpansionII(expression: str) -> List[str]:
              s = expression
              pos = [0]

              def parse_union():
                  result = set(parse_concat())
                  while pos[0] < len(s) and s[pos[0]] == ',':
                      pos[0] += 1
                      result |= parse_concat()
                  return result

              def parse_concat():
                  result = {''}
                  while pos[0] < len(s) and s[pos[0]] not in ',}':
                      if s[pos[0]] == '{':
                          pos[0] += 1
                          part = parse_union()
                          pos[0] += 1
                      else:
                          part = {s[pos[0]]}
                          pos[0] += 1
                      result = {a + b for a in result for b in part}
                  return result

              return sorted(parse_union())
        `,
        javascript: code`
          var braceExpansionII = function(expression) {
              var s = expression, pos = 0;
              var parseUnion = function() {
                  var result = parseConcat();
                  while (pos < s.length && s[pos] === ",") {
                      pos++;
                      parseConcat().forEach(function(w) { result.add(w); });
                  }
                  return result;
              };
              var parseConcat = function() {
                  var result = new Set([""]);
                  while (pos < s.length && s[pos] !== "," && s[pos] !== "}") {
                      var part;
                      if (s[pos] === "{") {
                          pos++;
                          part = parseUnion();
                          pos++;
                      } else {
                          part = new Set([s[pos]]);
                          pos++;
                      }
                      var next = new Set();
                      result.forEach(function(a) {
                          part.forEach(function(b) { next.add(a + b); });
                      });
                      result = next;
                  }
                  return result;
              };
              return Array.from(parseUnion()).sort();
          };
        `,
        typescript: code`
          function braceSortUnique(words: string[]): string[] {
              var sorted = words.slice();
              sorted.sort();
              var out: string[] = [];
              for (var i = 0; i < sorted.length; i++) {
                  if (i === 0 || sorted[i] !== sorted[i - 1]) out.push(sorted[i]);
              }
              return out;
          }

          function braceExpansionII(expression: string): string[] {
              var s = expression, pos = 0;
              function parseUnion(): string[] {
                  var result = parseConcat();
                  while (pos < s.length && s.charAt(pos) === ",") {
                      pos++;
                      result = result.concat(parseConcat());
                  }
                  return braceSortUnique(result);
              }
              function parseConcat(): string[] {
                  var result: string[] = [""];
                  while (pos < s.length && s.charAt(pos) !== "," && s.charAt(pos) !== "}") {
                      var part: string[];
                      if (s.charAt(pos) === "{") {
                          pos++;
                          part = parseUnion();
                          pos++;
                      } else {
                          part = [s.charAt(pos)];
                          pos++;
                      }
                      var next: string[] = [];
                      for (var i = 0; i < result.length; i++) {
                          for (var j = 0; j < part.length; j++) next.push(result[i] + part[j]);
                      }
                      result = braceSortUnique(next);
                  }
                  return result;
              }
              return parseUnion();
          }
        `,
        java: code`
          private static String braceSrc;
          private static int bracePos;

          private static Set<String> braceUnionPart() {
              Set<String> result = braceConcatPart();
              while (bracePos < braceSrc.length() && braceSrc.charAt(bracePos) == ',') {
                  bracePos++;
                  result.addAll(braceConcatPart());
              }
              return result;
          }

          private static Set<String> braceConcatPart() {
              Set<String> result = new HashSet<>();
              result.add("");
              while (bracePos < braceSrc.length() && braceSrc.charAt(bracePos) != ',' && braceSrc.charAt(bracePos) != '}') {
                  Set<String> part;
                  if (braceSrc.charAt(bracePos) == '{') {
                      bracePos++;
                      part = braceUnionPart();
                      bracePos++;
                  } else {
                      part = new HashSet<>();
                      part.add(String.valueOf(braceSrc.charAt(bracePos)));
                      bracePos++;
                  }
                  Set<String> next = new HashSet<>();
                  for (String a : result) for (String b : part) next.add(a + b);
                  result = next;
              }
              return result;
          }

          public static String[] braceExpansionII(String expression) {
              braceSrc = expression;
              bracePos = 0;
              TreeSet<String> sorted = new TreeSet<>(braceUnionPart());
              return sorted.toArray(new String[0]);
          }
        `,
        cpp: code`
          set<string> braceUnionPart(const string& s, int& pos);

          set<string> braceConcatPart(const string& s, int& pos) {
              set<string> result;
              result.insert("");
              while (pos < (int)s.size() && s[pos] != ',' && s[pos] != '}') {
                  set<string> part;
                  if (s[pos] == '{') {
                      pos++;
                      part = braceUnionPart(s, pos);
                      pos++;
                  } else {
                      part.insert(string(1, s[pos]));
                      pos++;
                  }
                  set<string> next;
                  for (const string& a : result)
                      for (const string& b : part) next.insert(a + b);
                  result = next;
              }
              return result;
          }

          set<string> braceUnionPart(const string& s, int& pos) {
              set<string> result = braceConcatPart(s, pos);
              while (pos < (int)s.size() && s[pos] == ',') {
                  pos++;
                  set<string> more = braceConcatPart(s, pos);
                  result.insert(more.begin(), more.end());
              }
              return result;
          }

          vector<string> braceExpansionII(string expression) {
              int pos = 0;
              set<string> all = braceUnionPart(expression, pos);
              return vector<string>(all.begin(), all.end());
          }
        `,
        c: code`
          typedef struct {
              char** items;
              int n;
              int cap;
          } BraceList;

          static const char* g_braceSrc;
          static int g_bracePos;
          static int g_braceLen;

          static void braceListPush(BraceList* l, char* s) {
              if (l->n == l->cap) {
                  l->cap = l->cap ? l->cap * 2 : 4;
                  l->items = (char**)realloc(l->items, sizeof(char*) * l->cap);
              }
              l->items[l->n++] = s;
          }

          static int braceCmp(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          static void braceNormalize(BraceList* l) {
              if (l->n == 0) return;
              qsort(l->items, l->n, sizeof(char*), braceCmp);
              int m = 1;
              for (int i = 1; i < l->n; i++) {
                  if (strcmp(l->items[i], l->items[m - 1]) != 0) l->items[m++] = l->items[i];
                  else free(l->items[i]);
              }
              l->n = m;
          }

          static BraceList braceUnionPart(void);

          static BraceList braceConcatPart(void) {
              BraceList result = { NULL, 0, 0 };
              char* empty = (char*)malloc(1);
              empty[0] = '\0';
              braceListPush(&result, empty);
              while (g_bracePos < g_braceLen && g_braceSrc[g_bracePos] != ',' && g_braceSrc[g_bracePos] != '}') {
                  BraceList part = { NULL, 0, 0 };
                  if (g_braceSrc[g_bracePos] == '{') {
                      g_bracePos++;
                      part = braceUnionPart();
                      g_bracePos++;
                  } else {
                      char* one = (char*)malloc(2);
                      one[0] = g_braceSrc[g_bracePos];
                      one[1] = '\0';
                      braceListPush(&part, one);
                      g_bracePos++;
                  }
                  BraceList next = { NULL, 0, 0 };
                  for (int i = 0; i < result.n; i++) {
                      for (int j = 0; j < part.n; j++) {
                          size_t la = strlen(result.items[i]), lb = strlen(part.items[j]);
                          char* w = (char*)malloc(la + lb + 1);
                          memcpy(w, result.items[i], la);
                          memcpy(w + la, part.items[j], lb + 1);
                          braceListPush(&next, w);
                      }
                  }
                  for (int i = 0; i < result.n; i++) free(result.items[i]);
                  free(result.items);
                  for (int j = 0; j < part.n; j++) free(part.items[j]);
                  free(part.items);
                  braceNormalize(&next);
                  result = next;
              }
              return result;
          }

          static BraceList braceUnionPart(void) {
              BraceList result = braceConcatPart();
              while (g_bracePos < g_braceLen && g_braceSrc[g_bracePos] == ',') {
                  g_bracePos++;
                  BraceList more = braceConcatPart();
                  for (int i = 0; i < more.n; i++) braceListPush(&result, more.items[i]);
                  free(more.items);
              }
              braceNormalize(&result);
              return result;
          }

          char** braceExpansionII(const char* expression, int* returnSize) {
              g_braceSrc = expression;
              g_bracePos = 0;
              g_braceLen = (int)strlen(expression);
              BraceList all = braceUnionPart();
              *returnSize = all.n;
              return all.items;
          }
        `,
        csharp: code`
          private static string braceSrc;
          private static int bracePos;

          private static HashSet<string> BraceUnionPart()
          {
              var result = BraceConcatPart();
              while (bracePos < braceSrc.Length && braceSrc[bracePos] == ',')
              {
                  bracePos++;
                  result.UnionWith(BraceConcatPart());
              }
              return result;
          }

          private static HashSet<string> BraceConcatPart()
          {
              var result = new HashSet<string> { "" };
              while (bracePos < braceSrc.Length && braceSrc[bracePos] != ',' && braceSrc[bracePos] != '}')
              {
                  HashSet<string> part;
                  if (braceSrc[bracePos] == '{')
                  {
                      bracePos++;
                      part = BraceUnionPart();
                      bracePos++;
                  }
                  else
                  {
                      part = new HashSet<string> { braceSrc[bracePos].ToString() };
                      bracePos++;
                  }
                  var next = new HashSet<string>();
                  foreach (var a in result)
                      foreach (var b in part) next.Add(a + b);
                  result = next;
              }
              return result;
          }

          public static string[] BraceExpansionII(string expression)
          {
              braceSrc = expression;
              bracePos = 0;
              var words = new List<string>(BraceUnionPart());
              words.Sort(string.CompareOrdinal);
              return words.ToArray();
          }
        `,
        go: code`
          func braceUnionPart(s string, pos *int) map[string]bool {
              result := braceConcatPart(s, pos)
              for *pos < len(s) && s[*pos] == ',' {
                  *pos++
                  for w := range braceConcatPart(s, pos) {
                      result[w] = true
                  }
              }
              return result
          }

          func braceConcatPart(s string, pos *int) map[string]bool {
              result := map[string]bool{"": true}
              for *pos < len(s) && s[*pos] != ',' && s[*pos] != '}' {
                  var part map[string]bool
                  if s[*pos] == '{' {
                      *pos++
                      part = braceUnionPart(s, pos)
                      *pos++
                  } else {
                      part = map[string]bool{string(s[*pos]): true}
                      *pos++
                  }
                  next := map[string]bool{}
                  for a := range result {
                      for b := range part {
                          next[a+b] = true
                      }
                  }
                  result = next
              }
              return result
          }

          func braceExpansionII(expression string) []string {
              pos := 0
              words := braceUnionPart(expression, &pos)
              res := make([]string, 0, len(words))
              for w := range words {
                  res = append(res, w)
              }
              sort.Strings(res)
              return res
          }
        `,
        kotlin: code`
          class BraceExpansionParser(private val s: String) {
              private var pos = 0

              fun parseUnion(): MutableSet<String> {
                  val result = parseConcat()
                  while (pos < s.length && s[pos] == ',') {
                      pos++
                      result.addAll(parseConcat())
                  }
                  return result
              }

              private fun parseConcat(): MutableSet<String> {
                  var result: MutableSet<String> = hashSetOf("")
                  while (pos < s.length && s[pos] != ',' && s[pos] != '}') {
                      val part: Set<String>
                      if (s[pos] == '{') {
                          pos++
                          part = parseUnion()
                          pos++
                      } else {
                          part = setOf(s[pos].toString())
                          pos++
                      }
                      val next = HashSet<String>()
                      for (a in result) for (b in part) next.add(a + b)
                      result = next
                  }
                  return result
              }
          }

          fun braceExpansionII(expression: String): Array<String> {
              return BraceExpansionParser(expression).parseUnion().sorted().toTypedArray()
          }
        `,
        swift: code`
          final class BraceExpansionParser {
              let s: [Character]
              var pos = 0

              init(_ text: String) {
                  s = Array(text)
              }

              func parseUnion() -> Set<String> {
                  var result = parseConcat()
                  while pos < s.count && s[pos] == "," {
                      pos += 1
                      result.formUnion(parseConcat())
                  }
                  return result
              }

              func parseConcat() -> Set<String> {
                  var result: Set<String> = [""]
                  while pos < s.count && s[pos] != "," && s[pos] != "}" {
                      let part: Set<String>
                      if s[pos] == "{" {
                          pos += 1
                          part = parseUnion()
                          pos += 1
                      } else {
                          part = [String(s[pos])]
                          pos += 1
                      }
                      var next = Set<String>()
                      for a in result {
                          for b in part { next.insert(a + b) }
                      }
                      result = next
                  }
                  return result
              }
          }

          func braceExpansionII(_ expression: String) -> [String] {
              return BraceExpansionParser(expression).parseUnion().sorted()
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          fn brace_union_part(s: &[u8], pos: &mut usize) -> BTreeSet<String> {
              let mut result = brace_concat_part(s, pos);
              while *pos < s.len() && s[*pos] == b',' {
                  *pos += 1;
                  let more = brace_concat_part(s, pos);
                  for w in more.into_iter() {
                      result.insert(w);
                  }
              }
              result
          }

          fn brace_concat_part(s: &[u8], pos: &mut usize) -> BTreeSet<String> {
              let mut result: BTreeSet<String> = BTreeSet::new();
              result.insert(String::new());
              while *pos < s.len() && s[*pos] != b',' && s[*pos] != b'}' {
                  let part: BTreeSet<String>;
                  if s[*pos] == b'{' {
                      *pos += 1;
                      part = brace_union_part(s, pos);
                      *pos += 1;
                  } else {
                      let mut one: BTreeSet<String> = BTreeSet::new();
                      one.insert((s[*pos] as char).to_string());
                      part = one;
                      *pos += 1;
                  }
                  let mut next: BTreeSet<String> = BTreeSet::new();
                  for a in result.iter() {
                      for b in part.iter() {
                          let mut w = a.clone();
                          w.push_str(b);
                          next.insert(w);
                      }
                  }
                  result = next;
              }
              result
          }

          fn braceExpansionII(expression: String) -> Vec<String> {
              let mut pos = 0usize;
              brace_union_part(expression.as_bytes(), &mut pos).into_iter().collect()
          }
        `,
        php: code`
          function braceUnionPart($s, &$pos) {
              $result = braceConcatPart($s, $pos);
              $n = strlen($s);
              while ($pos < $n && $s[$pos] === ',') {
                  $pos++;
                  foreach (braceConcatPart($s, $pos) as $w => $unused) $result[$w] = true;
              }
              return $result;
          }

          function braceConcatPart($s, &$pos) {
              $result = ['' => true];
              $n = strlen($s);
              while ($pos < $n && $s[$pos] !== ',' && $s[$pos] !== '}') {
                  if ($s[$pos] === '{') {
                      $pos++;
                      $part = braceUnionPart($s, $pos);
                      $pos++;
                  } else {
                      $part = [$s[$pos] => true];
                      $pos++;
                  }
                  $next = [];
                  foreach ($result as $a => $unusedA) {
                      foreach ($part as $b => $unusedB) {
                          $next[$a . $b] = true;
                      }
                  }
                  $result = $next;
              }
              return $result;
          }

          function braceExpansionII($expression) {
              $pos = 0;
              $words = [];
              foreach (braceUnionPart($expression, $pos) as $w => $unused) $words[] = (string)$w;
              sort($words, SORT_STRING);
              return $words;
          }
        `,
        ruby: code`
          def brace_union_part(s, pos)
            result = brace_concat_part(s, pos)
            while pos[0] < s.length && s[pos[0]] == ','
              pos[0] += 1
              result |= brace_concat_part(s, pos)
            end
            result
          end

          def brace_concat_part(s, pos)
            result = ['']
            while pos[0] < s.length && s[pos[0]] != ',' && s[pos[0]] != '}'
              if s[pos[0]] == '{'
                pos[0] += 1
                part = brace_union_part(s, pos)
                pos[0] += 1
              else
                part = [s[pos[0]]]
                pos[0] += 1
              end
              result = result.product(part).map { |a, b| a + b }.uniq
            end
            result
          end

          def braceExpansionII(expression)
            brace_union_part(expression, [0]).uniq.sort
          end
        `,
      },
    };
  })(),

];
