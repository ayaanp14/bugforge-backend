import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "interview-idioms",
  title: "Interview idioms",
  blurb: "The round and the file template with fast I/O, the idiom sheet of shapes and their Python, the twelve pitfalls interviewers watch for, a hash map, dynamic array, LRU cache and heap by hand, clean solutions under pressure, and the Python theory drill.",
  icon: "trophy",
  overview: `Nineteen modules taught the language. This one teaches the round: how a Python interview or contest problem is actually conducted, what is actually judged, and the small set of habits that turn knowing Python into passing.

It opens with the rhythm — restate, example, brute force, shape, complexity, code, test — and the file template every judged solution starts from: all tokens read once, \`main\` plus a \`solve\`, the recursion limit when recursing, batched output, each line with its cost so it can be defended. The idiom sheet names the shapes problems take and the two-to-six-line Python for each: counting with \`Counter\`, sorting by tuple key, windows and two pointers, prefix sums, stacks, heaps, BFS with a deque, \`bisect\`, set arithmetic. The pitfalls lesson is the twelve one-line mistakes — mutable defaults, the shared-row grid, late-binding closures, \`is\` for values, mutating while iterating, \`.sort()\` returning \`None\`, floor division, float equality, the O(n²) string, the recursion limit, \`or\` returning operands, the broad \`except\` — as a checklist. Implement the built-in builds a chained hash map with resize, a doubling array, an \`OrderedDict\` LRU cache and a binary heap in the shape interviewers expect: invariant, operations, complexity. Writing clean solutions is structure, names, edges first and tests in the file. The theory drill is thirty questions with the answers an interviewer wants to hear.

The exercises are the problems interviewers set, written the way the module says to write them: statistics and a region count with the template, anagram groups and the longest window without repeats, a fixer for four planted bugs and fifteen expressions to predict before running, the hash map and the LRU cache by hand, balanced brackets and a leaderboard with pure helpers, the MRO by hand and a generator pipeline whose trace shows laziness. The final checkpoint sets a sliding-window rate limiter, an RPN evaluator with error handling, and an interval merger with \`bisect\` queries — and, with the other nineteen modules, completes the plan.`,
  lessons: [
    {
      slug: "the-interview-template",
      file: "01-the-interview-template.md",
      exercises: [
        {
          title: "Statistics with the template",
          prompt: `Using the template — \`sys.stdin.buffer.read().split()\`, a \`solve\` function and \`main\` — read \`n\` followed by \`n\` integers (which may span several lines) and print \`count <n>\`, \`sum <s>\`, \`min <m>\`, \`max <M>\`, \`mean <mean:.2f>\` and \`median <median:.1f>\` (the median of an even count is the mean of the two middle values).

**Input:** \`n\`, then \`n\` integers.
**Output:** six lines.

\`\`\`text
5
3 1 4 1 5
\`\`\`
prints
\`\`\`text
count 5
sum 14
min 1
max 5
mean 2.80
median 3.0
\`\`\``,
          starter: String.raw`import sys


def solve(nums: list[int]) -> list[str]:
    # TODO: the six lines
    return []


def main() -> None:
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    nums = [int(tok) for tok in data[1:n + 1]]
    print("\n".join(solve(nums)))


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys


def solve(nums: list[int]) -> list[str]:
    ordered = sorted(nums)
    n = len(ordered)
    mid = n // 2
    median = ordered[mid] if n % 2 else (ordered[mid - 1] + ordered[mid]) / 2
    return [
        f"count {n}",
        f"sum {sum(nums)}",
        f"min {ordered[0]}",
        f"max {ordered[-1]}",
        f"mean {sum(nums) / n:.2f}",
        f"median {median:.1f}",
    ]


def main() -> None:
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    nums = [int(tok) for tok in data[1:n + 1]]
    print("\n".join(solve(nums)))


if __name__ == "__main__":
    main()
`,
          hints: [
            "`int(b\"42\")` works on the byte tokens directly — no decoding step.",
            "Sort once; the median is the middle element or the mean of the two middle ones.",
          ],
          cases: [
            { stdin: "5\n3 1 4 1 5\n", expected: "count 5\nsum 14\nmin 1\nmax 5\nmean 2.80\nmedian 3.0\n" },
            { stdin: "1\n42\n", expected: "count 1\nsum 42\nmin 42\nmax 42\nmean 42.00\nmedian 42.0\n", hidden: true },
            { stdin: "4\n-2 7\n0 7\n", expected: "count 4\nsum 12\nmin -2\nmax 7\nmean 3.00\nmedian 3.5\n", hidden: true },
            { stdin: "6\n10 20 30 40 50 60\n", expected: "count 6\nsum 210\nmin 10\nmax 60\nmean 35.00\nmedian 35.0\n", hidden: true },
          ],
        },
        {
          title: "Count the regions",
          prompt: `Read \`r c\` and then \`r\` rows of \`.\` and \`#\`. Count the 4-connected regions of \`#\` with a breadth-first search (a \`deque\` and a \`seen\` set, no recursion) and print \`regions <count>\` and \`largest <size of the largest region>\` (0 when there is none).

**Input:** the dimensions, then the grid.
**Output:** two lines.

\`\`\`text
4 5
##..#
#...#
..#..
..##.
\`\`\`
prints
\`\`\`text
regions 3
largest 3
\`\`\``,
          starter: String.raw`import sys
from collections import deque


def region_sizes(grid: list[str]) -> list[int]:
    # TODO: BFS from every unseen '#'; return the size of each region
    return []


def main() -> None:
    tokens = sys.stdin.read().split()
    rows, cols = int(tokens[0]), int(tokens[1])
    grid = tokens[2:2 + rows]
    sizes = region_sizes(grid)
    print("regions", len(sizes))
    print("largest", max(sizes, default=0))


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys
from collections import deque


def region_sizes(grid: list[str]) -> list[int]:
    rows, cols = len(grid), len(grid[0]) if grid else 0
    seen = set()
    sizes = []
    for r0 in range(rows):
        for c0 in range(cols):
            if grid[r0][c0] != "#" or (r0, c0) in seen:
                continue
            queue = deque([(r0, c0)])
            seen.add((r0, c0))
            size = 0
            while queue:
                r, c = queue.popleft()
                size += 1
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "#" and (nr, nc) not in seen:
                        seen.add((nr, nc))
                        queue.append((nr, nc))
            sizes.append(size)
    return sizes


def main() -> None:
    tokens = sys.stdin.read().split()
    rows, cols = int(tokens[0]), int(tokens[1])
    grid = tokens[2:2 + rows]
    sizes = region_sizes(grid)
    print("regions", len(sizes))
    print("largest", max(sizes, default=0))


if __name__ == "__main__":
    main()
`,
          hints: [
            "Mark a cell as seen when it is *enqueued*, not when it is dequeued, or it can be queued twice.",
            "The four neighbour offsets in a tuple and one bounds check keep the inner loop to four lines.",
          ],
          cases: [
            { stdin: "4 5\n##..#\n#...#\n..#..\n..##.\n", expected: "regions 3\nlargest 3\n" },
            { stdin: "1 1\n.\n", expected: "regions 0\nlargest 0\n", hidden: true },
            { stdin: "2 2\n##\n##\n", expected: "regions 1\nlargest 4\n", hidden: true },
            { stdin: "3 3\n#.#\n.#.\n#.#\n", expected: "regions 5\nlargest 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the first thing to do when given a problem in a round?",
          options: ["Start typing the brute force", "Restate it and ask about sizes and edge cases", "Ask for the answer", "Write tests"],
          answer: 1,
          explanation: "The sizes decide the algorithm; the edges decide the code; silence is the failure mode.",
        },
        {
          prompt: "Why `sys.stdin.buffer.read().split()` rather than `input()` in a loop for 10⁵ lines?",
          options: ["It is shorter", "One system call and no decoding — roughly ten times faster", "`input()` is deprecated", "It handles Unicode"],
          answer: 1,
          explanation: "For ten lines it does not matter and `input()` is clearer.",
        },
        {
          prompt: "What does `sys.setrecursionlimit(1_000_000)` allow, and what remains a risk?",
          options: ["Nothing", "Deep recursion past the default 1000 frames; a very deep recursion can still exhaust the C stack", "Faster recursion", "Tail calls"],
          answer: 1,
          explanation: "An iterative DFS with an explicit stack is the safe answer for the largest inputs.",
        },
        {
          prompt: "Why keep the work in `main()` and a `solve()` rather than at module level?",
          options: ["Style only", "Locals are faster than globals and the function can be imported and tested", "It is required", "Globals are not allowed"],
          answer: 1,
          explanation: "A solve function whose name is the idea is also what the interviewer reads.",
        },
        {
          prompt: "Which of these is scored in a round beyond correctness?",
          options: ["Typing speed", "Naming the complexity before coding and testing the edges unasked", "Using the fewest lines", "Avoiding imports"],
          answer: 1,
          explanation: "Clarification, complexity, readability and testing are most of the score.",
        },
      ],
    },
    {
      slug: "the-idiom-sheet",
      file: "02-the-idiom-sheet.md",
      exercises: [
        {
          title: "Group anagrams",
          prompt: `Read one line of words. Group words that are anagrams of each other with a \`defaultdict(list)\` keyed by the word's sorted letters. Print each group on its own line — words in input order, groups in order of first appearance — then \`groups <count>\`.

**Input:** one line of words.
**Output:** one line per group, then the count.

\`\`\`text
eat tea tan ate nat bat
\`\`\`
prints
\`\`\`text
eat tea ate
tan nat
bat
groups 3
\`\`\``,
          starter: String.raw`from collections import defaultdict


def group_anagrams(words: list[str]) -> list[list[str]]:
    # TODO
    return []


groups = group_anagrams(input().split())
for group in groups:
    print(" ".join(group))
print("groups", len(groups))
`,
          solution: String.raw`from collections import defaultdict


def group_anagrams(words: list[str]) -> list[list[str]]:
    groups = defaultdict(list)
    for word in words:
        groups["".join(sorted(word))].append(word)
    return list(groups.values())


groups = group_anagrams(input().split())
for group in groups:
    print(" ".join(group))
print("groups", len(groups))
`,
          hints: [
            "Two anagrams have the same letters, so the same sorted string — that is the key.",
            "A dict keeps insertion order, so `values()` already gives groups in order of first appearance.",
          ],
          cases: [
            { stdin: "eat tea tan ate nat bat\n", expected: "eat tea ate\ntan nat\nbat\ngroups 3\n" },
            { stdin: "a\n", expected: "a\ngroups 1\n", hidden: true },
            { stdin: "abc bca cab xyz zyx\n", expected: "abc bca cab\nxyz zyx\ngroups 2\n", hidden: true },
          ],
        },
        {
          title: "Longest window without repeats",
          prompt: `Read one word. Find the longest substring with no repeated character in O(n) with a sliding window — a \`start\` index and a dict of each character's last index. Print \`length <n>\` and \`window <substring>\` (the first such substring when several have the maximum length).

**Input:** one word.
**Output:** two lines.

\`\`\`text
abcabcbb
\`\`\`
prints
\`\`\`text
length 3
window abc
\`\`\``,
          starter: String.raw`def longest_unique(s: str) -> str:
    # TODO: sliding window with last-seen indices
    return ""


window = longest_unique(input().strip())
print("length", len(window))
print("window", window)
`,
          solution: String.raw`def longest_unique(s: str) -> str:
    last = {}
    start = 0
    best_start, best_len = 0, 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        if i - start + 1 > best_len:
            best_start, best_len = start, i - start + 1
    return s[best_start:best_start + best_len]


window = longest_unique(input().strip())
print("length", len(window))
print("window", window)
`,
          hints: [
            "When the current character was last seen inside the window, move `start` just past that index.",
            "Update the best only on a strictly longer window so the first maximum wins.",
          ],
          cases: [
            { stdin: "abcabcbb\n", expected: "length 3\nwindow abc\n" },
            { stdin: "bbbbb\n", expected: "length 1\nwindow b\n", hidden: true },
            { stdin: "pwwkew\n", expected: "length 3\nwindow wke\n", hidden: true },
            { stdin: "dvdf\n", expected: "length 3\nwindow vdf\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "\"Find the k most frequent words\" is which shape?",
          options: ["Two pointers", "A frequency count, then a heap (`nsmallest` with a key) or a sort", "Binary search", "BFS"],
          answer: 1,
          explanation: "`Counter` then `heapq.nsmallest(k, counts, key=lambda w: (-counts[w], w))`.",
        },
        {
          prompt: "How do you sort by score descending and then name ascending in one call?",
          options: ["`sorted(xs, reverse=True)`", "`sorted(xs, key=lambda p: (-p.score, p.name))`", "Two `reverse` flags", "`sorted(xs, key=score)` then `reverse()`"],
          answer: 1,
          explanation: "Negate the number inside the tuple key; `reverse=True` would flip the name order too.",
        },
        {
          prompt: "What is the idiom for shortest path in an unweighted grid?",
          options: ["Recursion", "BFS with a `deque` and a `seen` set", "Dijkstra with a heap", "Sorting"],
          answer: 1,
          explanation: "Each layer of the BFS is one more step; a heap is for weighted edges.",
        },
        {
          prompt: "What does `bisect_left(xs, x)` return on a sorted list?",
          options: ["Whether `x` is present", "The first index whose element is not below `x` — also the count of elements less than `x`", "The last index of `x`", "The median"],
          answer: 1,
          explanation: "`bisect_right` gives the count of elements ≤ `x`.",
        },
        {
          prompt: "Which expression transposes a grid stored as a list of rows?",
          options: ["`grid[::-1]`", "`list(zip(*grid))`", "`reversed(grid)`", "`grid.T`"],
          answer: 1,
          explanation: "Unpacking the rows into `zip` pairs up the columns.",
        },
      ],
    },
    {
      slug: "pitfalls-that-fail-interviews",
      file: "03-pitfalls-that-fail-interviews.md",
      exercises: [
        {
          title: "Fix the idioms",
          prompt: `The starter is a working program with four bugs from this lesson planted in \`make_grid\`, \`record\`, \`make_multipliers\` and \`remove_evens\`: a shared-row grid, a mutable default, late-binding closures and mutation while iterating. Fix all four without changing \`main\`. It reads \`r c\` and a line of integers, sets \`grid[0][0] = 1\` and prints \`rows <sum of each row>\`, calls \`record\` once per integer with a fresh history each time and prints \`history <length of the last one>\`, applies multipliers 1, 2, 3 to the first integer and prints \`multipliers <results>\`, and prints \`odds <the odd integers>\` (or \`odds none\`).

**Input:** \`r c\`, then the integers.
**Output:** four lines.

\`\`\`text
2 3
2 2 3 4 4 5
\`\`\`
prints
\`\`\`text
rows 1 0
history 1
multipliers 2 4 6
odds 3 5
\`\`\``,
          starter: String.raw`def make_grid(rows, cols):
    return [[0] * cols] * rows


def record(value, history=[]):
    history.append(value)
    return history


def make_multipliers(ks):
    return [lambda x: x * k for k in ks]


def remove_evens(xs):
    for x in xs:
        if x % 2 == 0:
            xs.remove(x)
    return xs


def main():
    rows, cols = map(int, input().split())
    nums = [int(x) for x in input().split()]
    grid = make_grid(rows, cols)
    grid[0][0] = 1
    print("rows", " ".join(str(sum(row)) for row in grid))
    for value in nums:
        history = record(value)
    print("history", len(history))
    print("multipliers", " ".join(str(f(nums[0])) for f in make_multipliers([1, 2, 3])))
    odds = remove_evens(list(nums))
    print("odds", " ".join(map(str, odds)) if odds else "none")


main()
`,
          solution: String.raw`def make_grid(rows, cols):
    return [[0] * cols for _ in range(rows)]


def record(value, history=None):
    if history is None:
        history = []
    history.append(value)
    return history


def make_multipliers(ks):
    return [lambda x, k=k: x * k for k in ks]


def remove_evens(xs):
    return [x for x in xs if x % 2]


def main():
    rows, cols = map(int, input().split())
    nums = [int(x) for x in input().split()]
    grid = make_grid(rows, cols)
    grid[0][0] = 1
    print("rows", " ".join(str(sum(row)) for row in grid))
    for value in nums:
        history = record(value)
    print("history", len(history))
    print("multipliers", " ".join(str(f(nums[0])) for f in make_multipliers([1, 2, 3])))
    odds = remove_evens(list(nums))
    print("odds", " ".join(map(str, odds)) if odds else "none")


main()
`,
          hints: [
            "A comprehension builds a fresh row per iteration; `None` as the default lets each call make its own list.",
            "Bind `k` with a default argument in the lambda; build the odds as a new list instead of removing while iterating.",
          ],
          cases: [
            { stdin: "2 3\n2 2 3 4 4 5\n", expected: "rows 1 0\nhistory 1\nmultipliers 2 4 6\nodds 3 5\n" },
            { stdin: "1 1\n7\n", expected: "rows 1\nhistory 1\nmultipliers 7 14 21\nodds 7\n", hidden: true },
            { stdin: "3 2\n4 6 8\n", expected: "rows 1 0 0\nhistory 1\nmultipliers 4 8 12\nodds none\n", hidden: true },
          ],
        },
        {
          title: "Predict, then verify",
          prompt: `Before running anything, write down what each expression below produces. Then write the program: read expressions one per line until EOF, evaluate each with \`eval\` in a namespace containing only \`math\`, and print \`<expression> => <repr of the value>\` or \`<expression> raises <exception type name>\`.

**Input:** one expression per line.
**Output:** one line per expression.

\`\`\`text
-7 // 2
-7 % 2
0.1 + 0.2 == 0.3
[1, 2] * 2
"a" * 3
1 < 2 < 3
1 == 1 or 2
[] or "x"
0 and 1
sorted([3, 1, 2]) == [1, 2, 3]
[1, 2, 3].sort()
int("12") + 1
"5" + 5
1 / 0
round(2.5)
\`\`\`
prints
\`\`\`text
-7 // 2 => -4
-7 % 2 => 1
0.1 + 0.2 == 0.3 => False
[1, 2] * 2 => [1, 2, 1, 2]
"a" * 3 => 'aaa'
1 < 2 < 3 => True
1 == 1 or 2 => True
[] or "x" => 'x'
0 and 1 => 0
sorted([3, 1, 2]) == [1, 2, 3] => True
[1, 2, 3].sort() => None
int("12") + 1 => 13
"5" + 5 raises TypeError
1 / 0 raises ZeroDivisionError
round(2.5) => 2
\`\`\``,
          starter: String.raw`import math
import sys


def evaluate(expression: str) -> str:
    # TODO: eval in {"math": math}; format the value or the exception type
    return ""


for line in sys.stdin:
    expression = line.strip()
    if expression:
        print(evaluate(expression))
`,
          solution: String.raw`import math
import sys


def evaluate(expression: str) -> str:
    try:
        value = eval(expression, {"__builtins__": __builtins__, "math": math})
    except Exception as e:
        return f"{expression} raises {type(e).__name__}"
    return f"{expression} => {value!r}"


for line in sys.stdin:
    expression = line.strip()
    if expression:
        print(evaluate(expression))
`,
          hints: [
            "`type(e).__name__` is the exception's class name; `repr` distinguishes `'x'` from `x` and `None` from nothing.",
            "Every expression in the example is one of the twelve pitfalls or a fact from Module 2 — predict first, then run.",
          ],
          cases: [
            { stdin: "-7 // 2\n-7 % 2\n0.1 + 0.2 == 0.3\n[1, 2] * 2\n\"a\" * 3\n1 < 2 < 3\n1 == 1 or 2\n[] or \"x\"\n0 and 1\nsorted([3, 1, 2]) == [1, 2, 3]\n[1, 2, 3].sort()\nint(\"12\") + 1\n\"5\" + 5\n1 / 0\nround(2.5)\n", expected: "-7 // 2 => -4\n-7 % 2 => 1\n0.1 + 0.2 == 0.3 => False\n[1, 2] * 2 => [1, 2, 1, 2]\n\"a\" * 3 => 'aaa'\n1 < 2 < 3 => True\n1 == 1 or 2 => True\n[] or \"x\" => 'x'\n0 and 1 => 0\nsorted([3, 1, 2]) == [1, 2, 3] => True\n[1, 2, 3].sort() => None\nint(\"12\") + 1 => 13\n\"5\" + 5 raises TypeError\n1 / 0 raises ZeroDivisionError\nround(2.5) => 2\n" },
            { stdin: "{1: \"a\"}[2]\n\"abc\"[::-1]\n2 ** 10\ndivmod(-7, 2)\nbool(\"False\")\n", expected: "{1: \"a\"}[2] raises KeyError\n\"abc\"[::-1] => 'cba'\n2 ** 10 => 1024\ndivmod(-7, 2) => (-4, 1)\nbool(\"False\") => True\n", hidden: true },
            { stdin: "math.isclose(0.1 + 0.2, 0.3)\n[1, 2, 3][3]\nlen(set([1, 1, 2]))\n", expected: "math.isclose(0.1 + 0.2, 0.3) => True\n[1, 2, 3][3] raises IndexError\nlen(set([1, 1, 2])) => 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `[[0] * 3] * 2` build?",
          options: ["Two independent rows", "Two references to one row — writing one cell changes both rows", "A 3×2 grid", "A tuple"],
          answer: 1,
          explanation: "`*` repeats references; use a comprehension per row.",
        },
        {
          prompt: "Why does `def f(x, acc=[])` keep growing across calls?",
          options: ["Lists are global", "The default is evaluated once at `def` time and shared by every call that omits it", "`append` is static", "It does not"],
          answer: 1,
          explanation: "Use `None` and create the list inside.",
        },
        {
          prompt: "What is `-7 // 2` and `-7 % 2`?",
          options: ["-3 and -1", "-4 and 1", "-3 and 1", "-4 and -1"],
          answer: 1,
          explanation: "Floor division and a remainder with the divisor's sign.",
        },
        {
          prompt: "What does `xs = xs.sort()` leave in `xs`?",
          options: ["The sorted list", "`None` — in-place methods return `None`", "A copy", "An iterator"],
          answer: 1,
          explanation: "`sorted(xs)` returns the new list; `xs.sort()` sorts in place.",
        },
        {
          prompt: "What does `x == 1 or 2` evaluate to when `x` is 5?",
          options: ["`False`", "`2` — `or` returns its second operand", "`True`", "Raises"],
          answer: 1,
          explanation: "Always truthy; `x in (1, 2)` is the intended test.",
        },
      ],
    },
    {
      slug: "implement-the-built-in",
      file: "04-implement-the-built-in.md",
      exercises: [
        {
          title: "A hash map with chaining",
          prompt: `Implement \`HashMap\` with separate chaining: buckets are lists of \`(key, value)\` pairs selected by \`hash(key) % capacity\`, the initial capacity is 4, and after a \`put\` that adds a new key the table doubles when \`size > 0.75 * capacity\`, rehashing every pair. Read commands until EOF: \`put <key> <value>\` (replace on an existing key), \`get <key>\` (print the value or \`missing\`), \`del <key>\` (print \`deleted\` or \`absent\`), \`len\` (print the size) and \`capacity\` (print the bucket count). Keys and values are words.

**Input:** one command per line.
**Output:** one line per printing command.

\`\`\`text
put a 1
put b 2
put a 3
get a
len
put c 4
put d 5
capacity
del b
get b
len
\`\`\`
prints
\`\`\`text
3
2
8
deleted
missing
3
\`\`\``,
          starter: String.raw`import sys


class HashMap:
    def __init__(self, capacity=4):
        self._buckets = [[] for _ in range(capacity)]
        self._size = 0

    def _bucket(self, key):
        return self._buckets[hash(key) % len(self._buckets)]

    def get(self, key, default=None):
        # TODO
        return default

    def put(self, key, value):
        # TODO: replace or append; resize past the load factor
        pass

    def delete(self, key):
        # TODO: return True when removed
        return False

    def _resize(self, capacity):
        # TODO: rehash every pair into new buckets
        pass

    @property
    def capacity(self):
        return len(self._buckets)

    def __len__(self):
        return self._size


table = HashMap()
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    # TODO: dispatch the five commands
`,
          solution: String.raw`import sys


class HashMap:
    def __init__(self, capacity=4):
        self._buckets = [[] for _ in range(capacity)]
        self._size = 0

    def _bucket(self, key):
        return self._buckets[hash(key) % len(self._buckets)]

    def get(self, key, default=None):
        for k, v in self._bucket(key):
            if k == key:
                return v
        return default

    def put(self, key, value):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)
                return
        bucket.append((key, value))
        self._size += 1
        if self._size > 0.75 * len(self._buckets):
            self._resize(2 * len(self._buckets))

    def delete(self, key):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:
                del bucket[i]
                self._size -= 1
                return True
        return False

    def _resize(self, capacity):
        pairs = [pair for bucket in self._buckets for pair in bucket]
        self._buckets = [[] for _ in range(capacity)]
        for key, value in pairs:
            self._bucket(key).append((key, value))

    @property
    def capacity(self):
        return len(self._buckets)

    def __len__(self):
        return self._size


table = HashMap()
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    command = parts[0]
    if command == "put":
        table.put(parts[1], parts[2])
    elif command == "get":
        print(table.get(parts[1], "missing"))
    elif command == "del":
        print("deleted" if table.delete(parts[1]) else "absent")
    elif command == "len":
        print(len(table))
    elif command == "capacity":
        print(table.capacity)
`,
          hints: [
            "`put` must search the bucket first: an existing key is replaced in place and the size does not change.",
            "Resize by collecting every pair, replacing the bucket list, and re-appending through `_bucket` so the new modulus applies.",
          ],
          cases: [
            { stdin: "put a 1\nput b 2\nput a 3\nget a\nlen\nput c 4\nput d 5\ncapacity\ndel b\nget b\nlen\n", expected: "3\n2\n8\ndeleted\nmissing\n3\n" },
            { stdin: "get x\ndel x\nlen\ncapacity\n", expected: "missing\nabsent\n0\n4\n", hidden: true },
            { stdin: "put k1 1\nput k2 2\nput k3 3\nput k4 4\nput k5 5\nput k6 6\nput k7 7\ncapacity\nlen\nget k7\n", expected: "16\n7\n7\n", hidden: true },
          ],
        },
        {
          title: "An LRU cache",
          prompt: `Implement \`LRUCache(capacity)\` with O(1) \`get\` and \`put\` using an \`OrderedDict\`: \`get\` returns the value and marks the key most recently used, or returns \`-1\`; \`put\` inserts or updates and marks it most recently used, evicting the least recently used key when the size exceeds the capacity. Read the capacity on the first line, then commands \`get <key>\` (print the result) and \`put <key> <value>\` until EOF; finally print \`keys <keys from least to most recently used>\`.

**Input:** the capacity, then commands.
**Output:** one line per \`get\`, then the keys.

\`\`\`text
2
put 1 1
put 2 2
get 1
put 3 3
get 2
put 4 4
get 1
get 3
get 4
\`\`\`
prints
\`\`\`text
1
-1
-1
3
4
keys 3 4
\`\`\``,
          starter: String.raw`import sys
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._items = OrderedDict()

    def get(self, key):
        # TODO
        return -1

    def put(self, key, value):
        # TODO
        pass

    def keys(self):
        return list(self._items)


capacity = int(sys.stdin.readline())
cache = LRUCache(capacity)
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    # TODO: get / put
print("keys", " ".join(cache.keys()))
`,
          solution: String.raw`import sys
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._items = OrderedDict()

    def get(self, key):
        if key not in self._items:
            return -1
        self._items.move_to_end(key)
        return self._items[key]

    def put(self, key, value):
        if key in self._items:
            self._items.move_to_end(key)
        self._items[key] = value
        if len(self._items) > self.capacity:
            self._items.popitem(last=False)

    def keys(self):
        return list(self._items)


capacity = int(sys.stdin.readline())
cache = LRUCache(capacity)
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    if parts[0] == "get":
        print(cache.get(parts[1]))
    elif parts[0] == "put":
        cache.put(parts[1], parts[2])
print("keys", " ".join(cache.keys()))
`,
          hints: [
            "`move_to_end(key)` is the O(1) \"touch\"; `popitem(last=False)` removes the oldest entry.",
            "Update the existing key before checking the size, or a replacement could evict something wrongly.",
          ],
          cases: [
            { stdin: "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4\n", expected: "1\n-1\n-1\n3\n4\nkeys 3 4\n" },
            { stdin: "1\nput a 1\nput b 2\nget a\n", expected: "-1\nkeys b\n", hidden: true },
            { stdin: "3\nput x 1\nput y 2\nput x 9\nget x\n", expected: "9\nkeys y x\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why does a hash map resize when its load factor passes a threshold?",
          options: ["To save memory", "To keep buckets short so lookups stay O(1) average; the O(n) rehash is amortised over many inserts", "To sort the keys", "It need not"],
          answer: 1,
          explanation: "Without resizing, chains grow and every operation degrades towards O(n).",
        },
        {
          prompt: "Why does a dynamic array double its capacity rather than add a constant?",
          options: ["Simplicity", "Doubling makes `append` amortised O(1); a constant step makes n appends O(n²)", "Memory alignment", "It does not matter"],
          answer: 1,
          explanation: "The total copying across n appends is under 2n elements.",
        },
        {
          prompt: "Which pair of structures gives an LRU cache O(1) for get, put and eviction?",
          options: ["A list and a set", "A dict plus a doubly linked list — what `OrderedDict` provides", "Two lists", "A heap and a dict"],
          answer: 1,
          explanation: "The dict finds the node; the list moves it to the tail and pops the head in O(1).",
        },
        {
          prompt: "What is the heap invariant in an array-backed binary min-heap?",
          options: ["The array is sorted", "Every parent at index i is ≤ its children at 2i+1 and 2i+2", "The root is the largest", "Children are adjacent"],
          answer: 1,
          explanation: "Push sifts up, pop sifts down; both O(log n).",
        },
        {
          prompt: "Why must a program never print the bucket contents of a hash map keyed by strings?",
          options: ["Buckets are private", "String hashing is randomised per process, so the bucket layout differs run to run", "Lists cannot be printed", "It is slow"],
          answer: 1,
          explanation: "Lookups, sizes and capacities are deterministic; the layout is not.",
        },
      ],
    },
    {
      slug: "writing-clean-solutions",
      file: "05-writing-clean-solutions.md",
      exercises: [
        {
          title: "Balanced brackets, cleanly",
          prompt: `Write \`check(s)\` as a pure function returning \`"balanced"\`, \`"unbalanced at <i>"\` for the index of the first closing bracket that has no matching opener, or \`"unclosed <n>"\` when the scan ends with \`n\` openers still open. Use a stack and a \`PAIRS\` constant mapping each closer to its opener; keep I/O in \`main\`. Read lines until EOF and print the verdict for each.

**Input:** one bracket string per line.
**Output:** one verdict per line.

\`\`\`text
([]{})
([)]
((
)
\`\`\`
prints
\`\`\`text
balanced
unbalanced at 2
unclosed 2
unbalanced at 0
\`\`\``,
          starter: String.raw`import sys

PAIRS = {")": "(", "]": "[", "}": "{"}


def check(s: str) -> str:
    # TODO: stack of openers
    return ""


def main() -> None:
    for line in sys.stdin:
        text = line.strip()
        if text:
            print(check(text))


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys

PAIRS = {")": "(", "]": "[", "}": "{"}


def check(s: str) -> str:
    stack = []
    for i, ch in enumerate(s):
        if ch in PAIRS.values():
            stack.append(ch)
        elif ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return f"unbalanced at {i}"
    return "balanced" if not stack else f"unclosed {len(stack)}"


def main() -> None:
    for line in sys.stdin:
        text = line.strip()
        if text:
            print(check(text))


if __name__ == "__main__":
    main()
`,
          hints: [
            "A closer with an empty stack, or one whose opener does not match the top, is the failure — return its index at once.",
            "What is left on the stack at the end is the number of unclosed openers.",
          ],
          cases: [
            { stdin: "([]{})\n([)]\n((\n)\n", expected: "balanced\nunbalanced at 2\nunclosed 2\nunbalanced at 0\n" },
            { stdin: "{[()()]}\n", expected: "balanced\n", hidden: true },
            { stdin: "(]\n[[]\n", expected: "unbalanced at 1\nunclosed 1\n", hidden: true },
          ],
        },
        {
          title: "A leaderboard",
          prompt: `Read lines \`<name> <score>\` until EOF into a frozen dataclass \`Player\`. Write \`rank(players)\` returning \`(rank, player)\` pairs ordered by score descending then name ascending, with dense ranks — equal scores share a rank and the next distinct score takes the next integer. Print \`<rank> <name> <score>\` per line. Keep parsing, ranking and printing in separate functions.

**Input:** one player per line.
**Output:** one line per player.

\`\`\`text
ann 50
bob 70
cy 50
dee 90
\`\`\`
prints
\`\`\`text
1 dee 90
2 bob 70
3 ann 50
3 cy 50
\`\`\``,
          starter: String.raw`import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Player:
    name: str
    score: int


def parse(lines: list[str]) -> list[Player]:
    # TODO
    return []


def rank(players: list[Player]) -> list[tuple[int, Player]]:
    """Dense ranks: equal scores share a rank; the next distinct score takes the next rank."""
    # TODO
    return []


def main() -> None:
    players = parse([line for line in sys.stdin.read().splitlines() if line.strip()])
    for position, player in rank(players):
        print(position, player.name, player.score)


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Player:
    name: str
    score: int


def parse(lines: list[str]) -> list[Player]:
    return [Player(name, int(score)) for name, score in (line.split() for line in lines)]


def rank(players: list[Player]) -> list[tuple[int, Player]]:
    """Dense ranks: equal scores share a rank; the next distinct score takes the next rank."""
    ordered = sorted(players, key=lambda p: (-p.score, p.name))
    ranks, current, previous = [], 0, None
    for player in ordered:
        if player.score != previous:
            current += 1
            previous = player.score
        ranks.append((current, player))
    return ranks


def main() -> None:
    players = parse([line for line in sys.stdin.read().splitlines() if line.strip()])
    for position, player in rank(players):
        print(position, player.name, player.score)


if __name__ == "__main__":
    main()
`,
          hints: [
            "Sort once with the tuple key; then walk the sorted list and bump the rank only when the score changes.",
            "`rank` takes and returns values, so it can be tested with a literal list of players.",
          ],
          cases: [
            { stdin: "ann 50\nbob 70\ncy 50\ndee 90\n", expected: "1 dee 90\n2 bob 70\n3 ann 50\n3 cy 50\n" },
            { stdin: "x 1\n", expected: "1 x 1\n", hidden: true },
            { stdin: "b 5\na 5\nc 5\n", expected: "1 a 5\n1 b 5\n1 c 5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where should reading and printing live in a clean solution?",
          options: ["Inside the solve function", "In `main`, with the solve function taking and returning values", "At module level", "Anywhere"],
          answer: 1,
          explanation: "A pure solve can be tested by calling it with a literal.",
        },
        {
          prompt: "Which name is right for a dict from word to count?",
          options: ["`d`", "`count_by_word`", "`data`", "`tmp`"],
          answer: 1,
          explanation: "Names say what they hold; a name that needs a comment is the wrong name.",
        },
        {
          prompt: "How should the empty-input case be handled?",
          options: ["Inside the main loop with a guard", "First, at the top of the function, with an early return or a raise — and say which you chose", "Ignored", "With a try/except"],
          answer: 1,
          explanation: "Edges first keeps the body free of guards and answers the clarifying question you asked.",
        },
        {
          prompt: "What do type hints and a dataclass provide in a solution?",
          options: ["Run-time checks", "Documentation of shapes that a reader gets without comments", "Speed", "Nothing"],
          answer: 1,
          explanation: "`p.score` instead of `p[1]`; the signature says what goes in and out.",
        },
        {
          prompt: "Which version should you write when a nested comprehension and a short loop do the same thing?",
          options: ["Always the comprehension", "The one a colleague understands on first reading — usually the loop that names the intermediate", "Always the loop", "Whichever is shorter"],
          answer: 1,
          explanation: "The interviewer is that colleague.",
        },
      ],
    },
    {
      slug: "python-theory-drill",
      file: "06-python-theory-drill.md",
      exercises: [
        {
          title: "The MRO by hand",
          prompt: `Define \`A\`, \`B(A)\`, \`C(A)\` and \`D(B, C)\`, each with a method \`who()\` that returns its own letter followed by \`>\` and \`super().who()\` — except \`A\`, which returns \`"A"\`. Read a class name and print \`mro <the class names in __mro__>\` and \`chain <the result of who() on an instance>\`.

**Input:** one class name.
**Output:** two lines.

\`\`\`text
D
\`\`\`
prints
\`\`\`text
mro D B C A object
chain D>B>C>A
\`\`\``,
          starter: String.raw`class A:
    def who(self):
        return "A"


# TODO: B(A), C(A), D(B, C) with cooperative who()


CLASSES = {"A": A}
name = input().strip()
cls = CLASSES[name]
print("mro", " ".join(k.__name__ for k in cls.__mro__))
print("chain", cls().who())
`,
          solution: String.raw`class A:
    def who(self):
        return "A"


class B(A):
    def who(self):
        return "B>" + super().who()


class C(A):
    def who(self):
        return "C>" + super().who()


class D(B, C):
    def who(self):
        return "D>" + super().who()


CLASSES = {"A": A, "B": B, "C": C, "D": D}
name = input().strip()
cls = CLASSES[name]
print("mro", " ".join(k.__name__ for k in cls.__mro__))
print("chain", cls().who())
`,
          hints: [
            "`super()` follows the instance's MRO, not the class's base list — so inside `B.who` on a `D`, `super()` is `C`.",
            "C3 linearisation puts `D B C A object`: each class before its bases, and `B` before `C` because of the order in `D`'s bases.",
          ],
          cases: [
            { stdin: "D\n", expected: "mro D B C A object\nchain D>B>C>A\n" },
            { stdin: "C\n", expected: "mro C A object\nchain C>A\n", hidden: true },
            { stdin: "A\n", expected: "mro A object\nchain A\n", hidden: true },
          ],
        },
        {
          title: "Laziness observed",
          prompt: `Read \`k\` on the first line and integers on the second. Build a generator pipeline over a shared \`log\` list: \`read_all\` yields each integer after appending \`read <x>\`; \`only_even\` appends \`keep <x>\` and yields evens, or appends \`drop <x>\`; \`squared\` appends \`square <x>\` and yields \`x * x\`. Take the first \`k\` results with \`itertools.islice\`. Print each log line, then \`result <values or none>\` and \`consumed <number of read lines> of <count of integers>\` — showing that only the integers needed were pulled.

**Input:** \`k\`, then the integers.
**Output:** the log, then two lines.

\`\`\`text
2
1 2 3 4 5 6
\`\`\`
prints
\`\`\`text
read 1
drop 1
read 2
keep 2
square 2
read 3
drop 3
read 4
keep 4
square 4
result 4 16
consumed 4 of 6
\`\`\``,
          starter: String.raw`from itertools import islice

k = int(input())
nums = [int(x) for x in input().split()]
log = []


def read_all(values):
    # TODO
    yield from values


def only_even(it):
    # TODO
    yield from it


def squared(it):
    # TODO
    yield from it


result = list(islice(squared(only_even(read_all(nums))), k))
for line in log:
    print(line)
print("result", " ".join(map(str, result)) if result else "none")
print("consumed", sum(line.startswith("read ") for line in log), "of", len(nums))
`,
          solution: String.raw`from itertools import islice

k = int(input())
nums = [int(x) for x in input().split()]
log = []


def read_all(values):
    for x in values:
        log.append(f"read {x}")
        yield x


def only_even(it):
    for x in it:
        if x % 2 == 0:
            log.append(f"keep {x}")
            yield x
        else:
            log.append(f"drop {x}")


def squared(it):
    for x in it:
        log.append(f"square {x}")
        yield x * x


result = list(islice(squared(only_even(read_all(nums))), k))
for line in log:
    print(line)
print("result", " ".join(map(str, result)) if result else "none")
print("consumed", sum(line.startswith("read ") for line in log), "of", len(nums))
`,
          hints: [
            "Each stage is a `for` over the previous stage with a `yield`; nothing runs until `islice` asks for a value.",
            "The trace interleaves stage by stage per item because each `next` pulls one item through the whole pipeline.",
          ],
          cases: [
            { stdin: "2\n1 2 3 4 5 6\n", expected: "read 1\ndrop 1\nread 2\nkeep 2\nsquare 2\nread 3\ndrop 3\nread 4\nkeep 4\nsquare 4\nresult 4 16\nconsumed 4 of 6\n" },
            { stdin: "0\n1 2 3\n", expected: "result none\nconsumed 0 of 3\n", hidden: true },
            { stdin: "5\n2 4\n", expected: "read 2\nkeep 2\nsquare 2\nread 4\nkeep 4\nsquare 4\nresult 4 16\nconsumed 2 of 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How are arguments passed in Python?",
          options: ["By value", "By assignment: the parameter is bound to the caller's object — mutation is visible, rebinding is not", "By reference", "By copy for lists"],
          answer: 1,
          explanation: "\"Pass by object reference\" is the phrase interviewers accept.",
        },
        {
          prompt: "What is a generator?",
          options: ["A list built lazily", "A function with `yield` whose call returns an iterator that keeps its frame between values", "A thread", "A decorator"],
          answer: 1,
          explanation: "Constant memory for streams of any length; consumed once.",
        },
        {
          prompt: "What does `super()` follow?",
          options: ["The class's first base", "The instance's MRO, so cooperative methods run once each in a diamond", "The parent's parent", "Nothing in multiple inheritance"],
          answer: 1,
          explanation: "In `D(B, C)`, `super()` inside `B.who` is `C`.",
        },
        {
          prompt: "What is the GIL, in one sentence?",
          options: ["A garbage collector", "A mutex letting one thread execute bytecode at a time, released during I/O — threads for waiting, processes for CPU", "A thread pool", "A lock on dicts"],
          answer: 1,
          explanation: "Name the mechanism and its consequence.",
        },
        {
          prompt: "What must be true of a dict key?",
          options: ["It is a string", "It is hashable: `__hash__` consistent with `__eq__` and never changing — so lists cannot be keys", "It is immutable", "It is small"],
          answer: 1,
          explanation: "Tuples of hashables and frozensets are the substitutes for lists and sets.",
        },
      ],
    },
    {
      slug: "interview-idioms-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A sliding-window rate limiter",
          prompt: `Read \`limit window\` on the first line, then non-decreasing integer timestamps one per line until EOF. A request at time \`t\` is allowed when fewer than \`limit\` requests were allowed in the interval \`(t - window, t]\`; keep the allowed timestamps in a \`deque\`, dropping those at or before \`t - window\` from the front. Print \`t=<t> allow\` or \`t=<t> deny\` per request, then \`allowed <a> denied <d>\`.

**Input:** the limit and window, then timestamps.
**Output:** one line per request, then the totals.

\`\`\`text
2 10
1
2
3
11
12
13
\`\`\`
prints
\`\`\`text
t=1 allow
t=2 allow
t=3 deny
t=11 allow
t=12 allow
t=13 deny
allowed 4 denied 2
\`\`\``,
          starter: String.raw`import sys
from collections import deque


class RateLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self._allowed = deque()

    def allow(self, t):
        # TODO: expire, then decide
        return False


def main():
    limit, window = map(int, sys.stdin.readline().split())
    limiter = RateLimiter(limit, window)
    allowed = denied = 0
    for line in sys.stdin:
        if not line.strip():
            continue
        t = int(line)
        # TODO


main()
`,
          solution: String.raw`import sys
from collections import deque


class RateLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self._allowed = deque()

    def allow(self, t):
        while self._allowed and self._allowed[0] <= t - self.window:
            self._allowed.popleft()
        if len(self._allowed) < self.limit:
            self._allowed.append(t)
            return True
        return False


def main():
    limit, window = map(int, sys.stdin.readline().split())
    limiter = RateLimiter(limit, window)
    allowed = denied = 0
    for line in sys.stdin:
        if not line.strip():
            continue
        t = int(line)
        if limiter.allow(t):
            allowed += 1
            print(f"t={t} allow")
        else:
            denied += 1
            print(f"t={t} deny")
    print(f"allowed {allowed} denied {denied}")


main()
`,
          hints: [
            "Only allowed requests enter the deque; denied ones do not count against later requests.",
            "Expire from the front while the oldest timestamp is at or before `t - window`; each timestamp is pushed and popped once, so the whole stream is O(n).",
          ],
          cases: [
            { stdin: "2 10\n1\n2\n3\n11\n12\n13\n", expected: "t=1 allow\nt=2 allow\nt=3 deny\nt=11 allow\nt=12 allow\nt=13 deny\nallowed 4 denied 2\n" },
            { stdin: "1 5\n0\n5\n6\n", expected: "t=0 allow\nt=5 allow\nt=6 deny\nallowed 2 denied 1\n", hidden: true },
            { stdin: "3 1\n7\n7\n7\n7\n", expected: "t=7 allow\nt=7 allow\nt=7 allow\nt=7 deny\nallowed 3 denied 1\n", hidden: true },
          ],
        },
        {
          title: "An RPN evaluator",
          prompt: `Read one reverse-Polish expression per line until EOF: integer tokens and the operators \`+\`, \`-\`, \`*\`, \`/\` (division truncates towards zero, as \`int(a / b)\`). Evaluate each with a stack and a dict from operator to function, and print \`= <value>\`, or \`error: stack underflow\` when an operator lacks two operands, \`error: division by zero\`, \`error: bad token <token>\` for anything else, or \`error: leftover operands\` when more than one value remains. Handle each error with a specific exception, not a bare \`except\`.

**Input:** one expression per line.
**Output:** one line per expression.

\`\`\`text
2 1 + 3 *
4 13 5 / +
10 6 9 3 + -11 * / * 17 + 5 +
1 +
1 0 /
1 2
1 x +
\`\`\`
prints
\`\`\`text
= 9
= 6
= 22
error: stack underflow
error: division by zero
error: leftover operands
error: bad token x
\`\`\``,
          starter: String.raw`import sys

OPS = {
    "+": lambda a, b: a + b,
    "-": lambda a, b: a - b,
    "*": lambda a, b: a * b,
    "/": lambda a, b: int(a / b),
}


class RpnError(Exception):
    pass


def evaluate(tokens: list[str]) -> int:
    # TODO: raise RpnError with the message for each failure
    return 0


for line in sys.stdin:
    tokens = line.split()
    if not tokens:
        continue
    try:
        print("=", evaluate(tokens))
    except RpnError as e:
        print("error:", e)
`,
          solution: String.raw`import sys

OPS = {
    "+": lambda a, b: a + b,
    "-": lambda a, b: a - b,
    "*": lambda a, b: a * b,
    "/": lambda a, b: int(a / b),
}


class RpnError(Exception):
    pass


def evaluate(tokens: list[str]) -> int:
    stack = []
    for token in tokens:
        if token in OPS:
            if len(stack) < 2:
                raise RpnError("stack underflow")
            b, a = stack.pop(), stack.pop()
            try:
                stack.append(OPS[token](a, b))
            except ZeroDivisionError:
                raise RpnError("division by zero") from None
        else:
            try:
                stack.append(int(token))
            except ValueError:
                raise RpnError(f"bad token {token}") from None
    if len(stack) != 1:
        raise RpnError("leftover operands" if stack else "stack underflow")
    return stack[0]


for line in sys.stdin:
    tokens = line.split()
    if not tokens:
        continue
    try:
        print("=", evaluate(tokens))
    except RpnError as e:
        print("error:", e)
`,
          hints: [
            "Pop the right operand first, then the left — `b, a = stack.pop(), stack.pop()` — or subtraction and division come out reversed.",
            "Translate `ZeroDivisionError` and `ValueError` into your own exception at the point they occur, with `from None` to keep the report clean.",
          ],
          cases: [
            { stdin: "2 1 + 3 *\n4 13 5 / +\n10 6 9 3 + -11 * / * 17 + 5 +\n1 +\n1 0 /\n1 2\n1 x +\n", expected: "= 9\n= 6\n= 22\nerror: stack underflow\nerror: division by zero\nerror: leftover operands\nerror: bad token x\n" },
            { stdin: "5\n-3 2 *\n7 -2 /\n", expected: "= 5\n= -6\n= -3\n", hidden: true },
            { stdin: "+\n3 4 - 2 *\n", expected: "error: stack underflow\n= -2\n", hidden: true },
          ],
        },
        {
          title: "Merge intervals with bisect queries",
          prompt: `Read \`n\`, then \`n\` lines \`a b\` (inclusive integer intervals, in any order), then \`q\` and \`q\` query points one per line. Merge overlapping or touching intervals after sorting by start, and print \`merged [a,b] [c,d] ...\`, \`covered <sum of (end - start) over the merged intervals>\`, then for each query \`t=<x> covered\` or \`t=<x> free\`, found with \`bisect_right\` on the merged starts.

**Input:** the intervals, then the queries.
**Output:** two summary lines, then one line per query.

\`\`\`text
3
1 3
2 6
8 10
3
5
7
10
\`\`\`
prints
\`\`\`text
merged [1,6] [8,10]
covered 7
t=5 covered
t=7 free
t=10 covered
\`\`\``,
          starter: String.raw`import sys
from bisect import bisect_right


def merge(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    # TODO: sort by start, extend or append
    return []


def is_covered(merged: list[tuple[int, int]], starts: list[int], t: int) -> bool:
    # TODO: the interval whose start is the last one <= t
    return False


def main() -> None:
    it = iter(sys.stdin.read().split())
    n = int(next(it))
    intervals = [(int(next(it)), int(next(it))) for _ in range(n)]
    q = int(next(it))
    queries = [int(next(it)) for _ in range(q)]
    merged = merge(intervals)
    starts = [a for a, _ in merged]
    print("merged", " ".join(f"[{a},{b}]" for a, b in merged))
    print("covered", sum(b - a for a, b in merged))
    for t in queries:
        print(f"t={t} {'covered' if is_covered(merged, starts, t) else 'free'}")


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys
from bisect import bisect_right


def merge(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def is_covered(merged: list[tuple[int, int]], starts: list[int], t: int) -> bool:
    i = bisect_right(starts, t) - 1
    return i >= 0 and merged[i][0] <= t <= merged[i][1]


def main() -> None:
    it = iter(sys.stdin.read().split())
    n = int(next(it))
    intervals = [(int(next(it)), int(next(it))) for _ in range(n)]
    q = int(next(it))
    queries = [int(next(it)) for _ in range(q)]
    merged = merge(intervals)
    starts = [a for a, _ in merged]
    print("merged", " ".join(f"[{a},{b}]" for a, b in merged))
    print("covered", sum(b - a for a, b in merged))
    for t in queries:
        print(f"t={t} {'covered' if is_covered(merged, starts, t) else 'free'}")


if __name__ == "__main__":
    main()
`,
          hints: [
            "After sorting, an interval overlaps the last merged one exactly when its start is at most that interval's end.",
            "`bisect_right(starts, t) - 1` is the last merged interval starting at or before `t`; check its end.",
          ],
          cases: [
            { stdin: "3\n1 3\n2 6\n8 10\n3\n5\n7\n10\n", expected: "merged [1,6] [8,10]\ncovered 7\nt=5 covered\nt=7 free\nt=10 covered\n" },
            { stdin: "1\n0 0\n1\n0\n", expected: "merged [0,0]\ncovered 0\nt=0 covered\n", hidden: true },
            { stdin: "4\n5 6\n1 2\n2 3\n6 7\n2\n4\n3\n", expected: "merged [1,3] [5,7]\ncovered 4\nt=4 free\nt=3 covered\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which line of the template reads all input in one system call?",
          options: ["`input()`", "`sys.stdin.buffer.read().split()`", "`sys.stdin.readline()`", "`open(0).read()` in a loop"],
          answer: 1,
          explanation: "Bytes tokens, no decoding, `int()` works directly.",
        },
        {
          prompt: "\"Longest subarray with at most k distinct values\" is which shape?",
          options: ["Prefix sums", "A sliding window with a count dict", "A heap", "Binary search"],
          answer: 1,
          explanation: "Advance the start while the window has more than k distinct values.",
        },
        {
          prompt: "What is the O(1) idiom for \"how many elements are less than x\" on a sorted list?",
          options: ["`xs.index(x)`", "`bisect_left(xs, x)` — O(log n)", "`xs.count(x)`", "A linear scan"],
          answer: 1,
          explanation: "Logarithmic, not constant — but the point is that it is not linear.",
        },
        {
          prompt: "Why is `for x in xs: xs.remove(x)` wrong?",
          options: ["`remove` is slow", "Removal shifts elements under the iterator, so items are skipped", "It raises", "Lists are immutable during iteration"],
          answer: 1,
          explanation: "Build a new list with a comprehension.",
        },
        {
          prompt: "What does a closure created in a loop see when called later?",
          options: ["The loop variable's value at creation", "The variable's final value — late binding — unless bound with a default argument", "An error", "`None`"],
          answer: 1,
          explanation: "`lambda x, k=k: ...` binds now.",
        },
        {
          prompt: "What makes `put` on a chained hash map amortised O(1) despite the O(n) resize?",
          options: ["Resizes never happen", "Doubling makes resizes rare enough that the total work spreads to a constant per insert", "Buckets are sorted", "Keys are ints"],
          answer: 1,
          explanation: "Same argument as the dynamic array.",
        },
        {
          prompt: "In an `OrderedDict` LRU cache, what does `popitem(last=False)` do?",
          options: ["Removes the newest", "Removes the oldest — the least recently used", "Clears the cache", "Returns the size"],
          answer: 1,
          explanation: "`move_to_end` keeps the most recently used at the end.",
        },
        {
          prompt: "Which is the clean shape for a judged solution?",
          options: ["Everything at module level", "`main` for I/O, `parse` for typing the input, a pure `solve` and small helpers", "One long function", "A class for everything"],
          answer: 1,
          explanation: "Testable, readable aloud, and the idea has a name.",
        },
        {
          prompt: "What is `-7 % 2`?",
          options: ["-1", "1", "0", "-7"],
          answer: 1,
          explanation: "The remainder takes the divisor's sign in Python.",
        },
        {
          prompt: "Which comparison is right for floats that should be equal?",
          options: ["`==`", "`math.isclose(a, b)`", "`is`", "`round(a) == round(b)`"],
          answer: 1,
          explanation: "Binary floats cannot represent most decimals exactly.",
        },
        {
          prompt: "What does `type(e).__name__` give inside `except Exception as e`?",
          options: ["The message", "The exception class name, such as `ValueError`", "The traceback", "The module"],
          answer: 1,
          explanation: "Useful for reporting; catching the specific class is still the rule.",
        },
        {
          prompt: "In `D(B, C)` with both bases deriving from `A`, what is `D.__mro__`?",
          options: ["D, A, B, C", "D, B, C, A, object", "D, B, A, C, A", "D, C, B, A, object"],
          answer: 1,
          explanation: "C3: each class before its bases, bases in the declared order, `A` once.",
        },
        {
          prompt: "Why does a generator pipeline with `islice(…, 2)` read only as many inputs as needed?",
          options: ["It reads all and discards", "Each `next` pulls one item through the stages; nothing runs ahead of demand", "It uses threads", "It caches"],
          answer: 1,
          explanation: "Laziness is per-item, end to end.",
        },
        {
          prompt: "A rate limiter keeps allowed timestamps in a deque. Why a deque and not a list?",
          options: ["Deques are sorted", "Expiring the oldest is `popleft()` in O(1); a list's `pop(0)` is O(n)", "Lists cannot hold ints", "Deques are thread-safe"],
          answer: 1,
          explanation: "Each timestamp is pushed and popped once: O(n) for the stream.",
        },
        {
          prompt: "How do you answer \"is t inside one of the merged intervals\" quickly?",
          options: ["Scan every interval", "`bisect_right` on the starts to find the last interval starting at or before t, then check its end", "A set of every integer", "Recursion"],
          answer: 1,
          explanation: "O(log n) per query after one O(n log n) merge.",
        },
      ],
    },
  ],
});
