import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "lists-and-tuples",
  title: "Lists, tuples and sequences",
  blurb: "Lists and their method costs, aliasing and copying, comprehensions in every form, sorting with keys, stability and bisect, tuples with unpacking and namedtuple, grids with neighbours and transposes, and the sequence tools with deque and the sequence protocol.",
  icon: "grid",
  overview: `The list is where Python's name-and-object model first becomes visible — two names, one list, one surprise — and where the cost of an operation first matters: \`append\` is constant, \`insert(0, x)\` is linear, \`x in xs\` scans. This module teaches the list and tuple thoroughly, the comprehension syntax that builds collections from expressions, and the sorting machinery — keys, stability, \`bisect\` — that every ordering question reduces to. It then applies all of it to the grid, the data structure behind most interview problems, and closes with the built-ins that work on every sequence and the two methods that make a class one.

Lists covers construction, the method table with costs, shallow and deep copies, the multiplication trap and the rule against modifying while iterating. Comprehensions gives the list, set, dict and generator forms, nesting, scope and the readability limit. Sorting covers \`sort\` versus \`sorted\`, key recipes, stability and multi-pass sorts, \`bisect\`. Tuples and unpacking fixes the comma, immutability and its caveat, unpacking with stars, and \`namedtuple\`. Grids gives templates for reading, building, walking, neighbours with a bounds check, transposing and printing. Sequence tools collects \`enumerate\`, \`zip\`, \`reversed\`, \`any\`/\`all\`, \`range\` as a sequence, \`deque\`, \`array\` and the sequence protocol.

The exercises are whole programs: a list editor with every method and its failure, shallow versus deep copies made observable, comprehension drills, a word index built from set and dict comprehensions, rank queries with \`bisect\`, a two-pass stable sort, starred unpacking of variable records, named points with \`_replace\`, a Game of Life step, transposes and rotations, sliding-window maxima on a bounded \`deque\`, and a class that implements the sequence protocol. The checkpoint adds an inventory edited and reported in aligned columns, an island counter over a grid with an explicit stack, and a live leaderboard kept sorted with \`insort\`.`,
  lessons: [
    {
      slug: "lists",
      file: "01-lists.md",
      exercises: [
        {
          title: "List editor",
          prompt: `Maintain a list of integers from commands read until the end of input: \`push v\` appends; \`pop\` removes the last (\`empty\` if there is none); \`insert i v\` inserts before index \`i\`; \`remove v\` removes the first equal value (\`not found\` if absent); \`del i\` deletes by index (\`out of range\` if invalid); \`show\` prints the list. Every error is reported without crashing, and the list is printed as space-separated values or \`(empty)\`.

**Input:** commands.
**Output:** one line per \`show\` and per error.

\`\`\`text
push 1
push 2
insert 0 9
remove 2
remove 7
show
\`\`\`
prints
\`\`\`text
not found
9 1
\`\`\``,
          starter: String.raw`import sys

xs = []
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: push / pop / insert / remove / del / show
`,
          solution: String.raw`import sys

xs = []
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "push":
        xs.append(int(args[0]))
    elif cmd == "pop":
        if xs:
            xs.pop()
        else:
            print("empty")
    elif cmd == "insert":
        xs.insert(int(args[0]), int(args[1]))
    elif cmd == "remove":
        value = int(args[0])
        if value in xs:
            xs.remove(value)
        else:
            print("not found")
    elif cmd == "del":
        i = int(args[0])
        if -len(xs) <= i < len(xs):
            del xs[i]
        else:
            print("out of range")
    elif cmd == "show":
        print(" ".join(map(str, xs)) if xs else "(empty)")
`,
          hints: [
            "`remove` raises `ValueError` on a missing value — test with `in` first (or catch it).",
            "A valid index for `del` satisfies `-len(xs) <= i < len(xs)`; `insert` never fails, it clips.",
          ],
          cases: [
            { stdin: "push 1\npush 2\ninsert 0 9\nremove 2\nremove 7\nshow\n", expected: "not found\n9 1\n" },
            { stdin: "pop\npush 5\ndel 3\ndel -1\nshow\n", expected: "empty\nout of range\n(empty)\n", hidden: true },
            { stdin: "push 3\npush 4\npush 5\ninsert 99 6\ndel 0\nshow\npop\nshow\n", expected: "4 5 6\n4 5\n", hidden: true },
          ],
        },
        {
          title: "Shallow versus deep",
          prompt: `Read a list literal (parse it with \`ast.literal_eval\`), make a **shallow** copy with \`list()\` and a **deep** copy with \`copy.deepcopy\`, then mutate the original: if its first element is a list, append \`99\` to that inner list; otherwise append \`99\` to the outer list. Print all three lists so the sharing is visible.

**Input:** one list literal.
**Output:** \`original: <list>\`, \`shallow: <list>\`, \`deep: <list>\` (printed with \`print\`'s own list format).

\`\`\`text
[[1, 2], [3]]
\`\`\`
prints
\`\`\`text
original: [[1, 2, 99], [3]]
shallow: [[1, 2, 99], [3]]
deep: [[1, 2], [3]]
\`\`\``,
          starter: String.raw`import ast
import copy

original = ast.literal_eval(input())
shallow = original      # TODO: a real shallow copy
deep = original         # TODO: a deep copy
if original and isinstance(original[0], list):
    original[0].append(99)
else:
    original.append(99)
print("original:", original)
print("shallow:", shallow)
print("deep:", deep)
`,
          solution: String.raw`import ast
import copy

original = ast.literal_eval(input())
shallow = list(original)
deep = copy.deepcopy(original)
if original and isinstance(original[0], list):
    original[0].append(99)
else:
    original.append(99)
print("original:", original)
print("shallow:", shallow)
print("deep:", deep)
`,
          hints: [
            "A shallow copy is a new outer list whose elements are the same inner objects — mutating an inner list shows through it.",
            "Appending to the *outer* original does not show in either copy, because the outer list is not shared.",
          ],
          cases: [
            { stdin: "[[1, 2], [3]]\n", expected: "original: [[1, 2, 99], [3]]\nshallow: [[1, 2, 99], [3]]\ndeep: [[1, 2], [3]]\n" },
            { stdin: "[1, 2]\n", expected: "original: [1, 2, 99]\nshallow: [1, 2]\ndeep: [1, 2]\n", hidden: true },
            { stdin: "[[]]\n", expected: "original: [[99]]\nshallow: [[99]]\ndeep: [[]]\n", hidden: true },
            { stdin: "[]\n", expected: "original: [99]\nshallow: []\ndeep: []\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which operation is O(n) on a list of length n?",
          options: ["`xs.append(x)`", "`xs.pop()`", "`xs.insert(0, x)`", "`xs[i]`"],
          answer: 2,
          explanation: "Inserting at the front shifts every element. Appending, popping the end and indexing are constant time; `collections.deque` makes front insertion O(1).",
        },
        {
          prompt: "What does this print?\n\n```python\ngrid = [[0] * 2] * 2\ngrid[0][0] = 1\nprint(grid)\n```",
          options: ["`[[1, 0], [0, 0]]`", "`[[1, 0], [1, 0]]`", "`[[1, 1], [1, 1]]`", "`[[0, 0], [0, 0]]`"],
          answer: 1,
          explanation: "`* 2` repeats the reference to one inner list, so both rows are the same object. `[[0] * 2 for _ in range(2)]` creates two rows.",
        },
        {
          prompt: "After `a = [[1], [2]]; b = a.copy(); b[0].append(9); b[1] = [0]`, what is `a`?",
          options: ["`[[1], [2]]`", "`[[1, 9], [2]]`", "`[[1, 9], [0]]`", "`[[1], [0]]`"],
          answer: 1,
          explanation: "The shallow copy shares the inner lists, so appending through `b[0]` is visible in `a`; rebinding `b[1]` only changes the copy's slot.",
        },
        {
          prompt: "Which line does what its author intended?",
          options: ["`xs = xs.append(4)`", "`xs = xs.sort()`", "`xs = sorted(xs)`", "`xs = xs.reverse()`"],
          answer: 2,
          explanation: "`sorted` returns a new list. The in-place methods return `None`, so the other assignments discard the list.",
        },
        {
          prompt: "What is the safe way to delete every element that satisfies `bad(x)` from `xs`?",
          options: ["`for x in xs: if bad(x): xs.remove(x)`", "`xs = [x for x in xs if not bad(x)]`", "`for i in range(len(xs)): if bad(xs[i]): del xs[i]`", "`xs.remove(bad)`"],
          answer: 1,
          explanation: "Building a new list never skips or shifts. Removing during forward iteration skips neighbours, and deleting by ascending index raises `IndexError` once the list shrinks.",
        },
      ],
    },
    {
      slug: "comprehensions",
      file: "02-comprehensions.md",
      exercises: [
        {
          title: "Comprehension drills",
          prompt: `From one line of integers produce four results, each with a single comprehension: the squares of the even values; a label per value (\`pos\`, \`neg\` or \`zero\`) using a conditional expression; the number of pairs \`(a, b)\` with \`a < b\` taken by index order from the list (a nested \`for\` with a filter, counted with \`len\`); and the sum of the absolute values as a generator expression inside \`sum\`.

**Input:** one line of integers.
**Output:** \`squares: <values>\`, \`labels: <words>\`, \`pairs: <n>\`, \`abs-sum: <n>\` (an empty list prints \`squares:\` with nothing after it).

\`\`\`text
1 -2 3 0
\`\`\`
prints
\`\`\`text
squares: 4 0
labels: pos neg pos zero
pairs: 3
abs-sum: 6
\`\`\``,
          starter: String.raw`xs = list(map(int, input().split()))
squares = []   # TODO
labels = []    # TODO
pairs = 0      # TODO: len of a nested comprehension over indexes i < j with xs[i] < xs[j]
abs_sum = 0    # TODO: sum of a generator
print("squares:", " ".join(map(str, squares)))
print("labels:", " ".join(labels))
print(f"pairs: {pairs}")
print(f"abs-sum: {abs_sum}")
`,
          solution: String.raw`xs = list(map(int, input().split()))
squares = [x * x for x in xs if x % 2 == 0]
labels = ["pos" if x > 0 else "neg" if x < 0 else "zero" for x in xs]
pairs = len([(a, b) for i, a in enumerate(xs) for b in xs[i + 1:] if a < b])
abs_sum = sum(abs(x) for x in xs)
print("squares:", " ".join(map(str, squares)))
print("labels:", " ".join(labels))
print(f"pairs: {pairs}")
print(f"abs-sum: {abs_sum}")
`,
          hints: [
            "The filter `if` goes after the `for`; the conditional expression goes before it.",
            "`for i, a in enumerate(xs) for b in xs[i + 1:]` visits each pair once in index order.",
          ],
          cases: [
            { stdin: "1 -2 3 0\n", expected: "squares: 4 0\nlabels: pos neg pos zero\npairs: 3\nabs-sum: 6\n" },
            { stdin: "\n", expected: "squares:\nlabels:\npairs: 0\nabs-sum: 0\n", hidden: true },
            { stdin: "4 4 4\n", expected: "squares: 16 16 16\nlabels: pos pos pos\npairs: 0\nabs-sum: 12\n", hidden: true },
            { stdin: "-1 -3 2\n", expected: "squares: 4\nlabels: neg neg pos\npairs: 2\nabs-sum: 6\n", hidden: true },
          ],
        },
        {
          title: "Word index",
          prompt: `Read one line of words. Print the distinct words in sorted order (a set comprehension over the lower-cased words, then \`sorted\`); a mapping from each distinct word to its length in first-seen order (a dict comprehension over \`dict.fromkeys(words)\`, which keeps order); and the total number of characters (a generator expression in \`sum\`).

**Input:** one line of words.
**Output:** \`unique: <sorted words>\`, \`lengths: <word=len pairs>\`, \`total: <n>\`.

\`\`\`text
Kiwi apple kiwi Fig
\`\`\`
prints
\`\`\`text
unique: apple fig kiwi
lengths: kiwi=4 apple=5 fig=3
total: 16
\`\`\``,
          starter: String.raw`words = [w.lower() for w in input().split()]
unique = set()      # TODO: set comprehension
lengths = {}        # TODO: dict comprehension over dict.fromkeys(words)
total = 0           # TODO: generator expression
print("unique:", " ".join(sorted(unique)))
print("lengths:", " ".join(f"{w}={n}" for w, n in lengths.items()))
print(f"total: {total}")
`,
          solution: String.raw`words = [w.lower() for w in input().split()]
unique = {w for w in words}
lengths = {w: len(w) for w in dict.fromkeys(words)}
total = sum(len(w) for w in words)
print("unique:", " ".join(sorted(unique)))
print("lengths:", " ".join(f"{w}={n}" for w, n in lengths.items()))
print(f"total: {total}")
`,
          hints: [
            "The set is only ever printed through `sorted`, so its order never matters.",
            "`dict.fromkeys(words)` deduplicates while keeping first-seen order — iterate it in the dict comprehension.",
          ],
          cases: [
            { stdin: "Kiwi apple kiwi Fig\n", expected: "unique: apple fig kiwi\nlengths: kiwi=4 apple=5 fig=3\ntotal: 16\n" },
            { stdin: "a a a\n", expected: "unique: a\nlengths: a=1\ntotal: 3\n", hidden: true },
            { stdin: "\n", expected: "unique:\nlengths:\ntotal: 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `[x if x > 0 else 0 for x in [-1, 2]]`?",
          options: ["`[2]`", "`[0, 2]`", "`SyntaxError`", "`[-1, 2]`"],
          answer: 1,
          explanation: "A conditional expression before the `for` produces one value per element. A filtering `if` after the `for` would produce `[2]`.",
        },
        {
          prompt: "What is `[(a, b) for a in range(2) for b in \"xy\"]`?",
          options: ["`[(0, 'x'), (0, 'y'), (1, 'x'), (1, 'y')]`", "`[(0, 'x'), (1, 'y')]`", "`[(0, 'x'), (1, 'x'), (0, 'y'), (1, 'y')]`", "`SyntaxError`"],
          answer: 0,
          explanation: "Multiple `for` clauses nest left to right: the first is the outer loop.",
        },
        {
          prompt: "What does `x` hold afterwards?\n\n```python\nx = 10\nys = [x for x in range(3)]\n```",
          options: ["`2`", "`10`", "`[0, 1, 2]`", "`NameError`"],
          answer: 1,
          explanation: "A comprehension has its own scope; its loop variable does not leak into the enclosing scope.",
        },
        {
          prompt: "Which is the better spelling of `sum([x * x for x in xs])`?",
          options: ["`sum(x * x for x in xs)`", "`sum(map(x * x, xs))`", "`reduce(sum, xs)`", "It is already optimal"],
          answer: 0,
          explanation: "The generator form feeds `sum` one value at a time without building an intermediate list. `map` needs a function, and `reduce(sum, …)` is wrong.",
        },
        {
          prompt: "Why is `[print(x) for x in xs]` discouraged?",
          options: [
            "`print` cannot be called in a comprehension",
            "It builds a list of `None` values only to run side effects — a `for` loop says what is meant",
            "It prints in reverse order",
            "It is slower than `map(print, xs)`",
          ],
          answer: 1,
          explanation: "Comprehensions build values; a loop with side effects should be a loop. The list of `None`s is allocated and thrown away.",
        },
      ],
    },
    {
      slug: "sorting",
      file: "03-sorting.md",
      exercises: [
        {
          title: "Rank queries with bisect",
          prompt: `Read a line of scores, then \`q\` queries. The rank of a score \`x\` is one plus the number of scores strictly greater than \`x\`. Sort the scores once (ascending) and answer each query in O(log n) with \`bisect.bisect_right\`.

**Input:** a line of integers, then \`q\`, then \`q\` integers.
**Output:** \`rank <r>\` per query.

\`\`\`text
50 80 80 90
3
80
100
0
\`\`\`
prints
\`\`\`text
rank 2
rank 1
rank 5
\`\`\``,
          starter: String.raw`import bisect

scores = sorted(map(int, input().split()))
q = int(input())
for _ in range(q):
    x = int(input())
    # TODO: greater = number of scores > x, via bisect_right
    greater = 0
    print(f"rank {greater + 1}")
`,
          solution: String.raw`import bisect

scores = sorted(map(int, input().split()))
q = int(input())
for _ in range(q):
    x = int(input())
    greater = len(scores) - bisect.bisect_right(scores, x)
    print(f"rank {greater + 1}")
`,
          hints: [
            "`bisect_right(scores, x)` is the number of scores `<= x`, so the rest are strictly greater.",
            "The list must be sorted ascending before any bisect call.",
          ],
          cases: [
            { stdin: "50 80 80 90\n3\n80\n100\n0\n", expected: "rank 2\nrank 1\nrank 5\n" },
            { stdin: "5\n2\n5\n4\n", expected: "rank 1\nrank 2\n", hidden: true },
            { stdin: "\n1\n7\n", expected: "rank 1\n", hidden: true },
            { stdin: "3 1 2\n3\n1\n2\n3\n", expected: "rank 3\nrank 2\nrank 1\n", hidden: true },
          ],
        },
        {
          title: "Two stable passes",
          prompt: `Read \`n\` employee records \`name dept salary\` and print them ordered by department ascending, then salary **descending**, then name ascending — using **two** \`sort\` calls, secondary keys first, relying on stability (no tuple with a negated string is possible here, so this is the technique).

**Input:** \`n\`, then \`n\` lines.
**Output:** the records, one per line, as \`dept name salary\`.

\`\`\`text
4
ada eng 120
bob ops 90
cy eng 120
dee eng 100
\`\`\`
prints
\`\`\`text
eng ada 120
eng cy 120
eng dee 100
ops bob 90
\`\`\``,
          starter: String.raw`n = int(input())
rows = []
for _ in range(n):
    name, dept, salary = input().split()
    rows.append((name, dept, int(salary)))
# TODO: sort by name, then by salary descending, then by dept — in that order
for name, dept, salary in rows:
    print(dept, name, salary)
`,
          solution: String.raw`n = int(input())
rows = []
for _ in range(n):
    name, dept, salary = input().split()
    rows.append((name, dept, int(salary)))
rows.sort(key=lambda r: r[0])
rows.sort(key=lambda r: r[2], reverse=True)
rows.sort(key=lambda r: r[1])
for name, dept, salary in rows:
    print(dept, name, salary)
`,
          hints: [
            "Sort by the least significant key first and the most significant key last.",
            "`reverse=True` keeps equal elements in their existing order — that is what makes the passes compose.",
          ],
          cases: [
            { stdin: "4\nada eng 120\nbob ops 90\ncy eng 120\ndee eng 100\n", expected: "eng ada 120\neng cy 120\neng dee 100\nops bob 90\n" },
            { stdin: "3\nzed a 1\namy a 1\nkim a 2\n", expected: "a kim 2\na amy 1\na zed 1\n", hidden: true },
            { stdin: "1\nsolo x 5\n", expected: "x solo 5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `sorted([\"b\", \"A\", \"c\"], key=str.lower)`?",
          options: ["`['A', 'b', 'c']`", "`['b', 'c', 'A']`", "`['a', 'b', 'c']`", "`['A', 'c', 'b']`"],
          answer: 0,
          explanation: "The key lowercases for comparison only; the original strings are returned in that order.",
        },
        {
          prompt: "Which key sorts pairs by second element descending, then first ascending?",
          options: ["`key=lambda p: (-p[1], p[0])`", "`key=lambda p: (p[1], p[0])` with `reverse=True`", "`key=lambda p: p[1] - p[0]`", "`key=lambda p: (p[0], -p[1])`"],
          answer: 0,
          explanation: "Negating the numeric second element reverses just that component; `reverse=True` would reverse both.",
        },
        {
          prompt: "Timsort is stable. What does that guarantee?",
          options: ["It never uses extra memory", "Elements with equal keys keep their relative input order", "It runs in O(n) on any input", "It sorts strings before numbers"],
          answer: 1,
          explanation: "Stability is what lets a sort by a secondary key followed by a sort by the primary key produce a multi-key order.",
        },
        {
          prompt: "For sorted `xs = [1, 3, 3, 7]`, what is `bisect.bisect_left(xs, 3)` and `bisect.bisect_right(xs, 3)`?",
          options: ["`1` and `3`", "`1` and `2`", "`2` and `3`", "`3` and `1`"],
          answer: 0,
          explanation: "`bisect_left` gives the first position where 3 fits (before equal elements), `bisect_right` the position after them; the difference is the count of 3s.",
        },
        {
          prompt: "What does `sorted([3, 1, 2], reverse=True)[:1]` cost, and what is cheaper for the largest element?",
          options: ["O(n log n); `max(xs)` is O(n)", "O(n); nothing is cheaper", "O(1); it is optimal", "O(n²); `heapq` is O(1)"],
          answer: 0,
          explanation: "Sorting the whole list to take one element is wasteful; `max` scans once. For a small top-k, `heapq.nlargest` is O(n log k).",
        },
        {
          prompt: "What happens with `sorted([1, \"2\", 3])`?",
          options: ["`[1, 3, '2']`", "`TypeError` — int and str are not comparable", "`['2', 1, 3]`", "`[1, 2, 3]`"],
          answer: 1,
          explanation: "Ordering comparisons between unrelated types raise. Convert first, or give a key that maps everything to one type.",
        },
      ],
    },
    {
      slug: "tuples-and-unpacking",
      file: "04-tuples-and-unpacking.md",
      exercises: [
        {
          title: "Records with a star",
          prompt: `Each line holds a name, then any number of integer scores (possibly none), then a city. Unpack every line with one starred assignment — \`name, *scores, city = tokens\` — and print the name, the city and the mean score with two decimals, or \`no scores\`.

**Input:** lines.
**Output:** \`<name> <city> <mean>\` or \`<name> <city> no scores\` per line.

\`\`\`text
ada 90 80 london
bob paris
\`\`\`
prints
\`\`\`text
ada london 85.00
bob paris no scores
\`\`\``,
          starter: String.raw`import sys

for line in sys.stdin:
    tokens = line.split()
    # TODO: name, *scores, city = tokens
`,
          solution: String.raw`import sys

for line in sys.stdin:
    tokens = line.split()
    name, *scores, city = tokens
    if scores:
        mean = sum(map(int, scores)) / len(scores)
        print(f"{name} {city} {mean:.2f}")
    else:
        print(f"{name} {city} no scores")
`,
          hints: [
            "The starred target takes everything between the first and last token — an empty list when there is nothing.",
            "The scores are still strings after unpacking; convert with `map(int, scores)`.",
          ],
          cases: [
            { stdin: "ada 90 80 london\nbob paris\n", expected: "ada london 85.00\nbob paris no scores\n" },
            { stdin: "cy 7 rome\n", expected: "cy rome 7.00\n", hidden: true },
            { stdin: "dee 1 2 3 4 5 6 oslo\n", expected: "dee oslo 3.50\n", hidden: true },
          ],
        },
        {
          title: "Named points",
          prompt: `Define \`Point = namedtuple("Point", "x y")\`. Read \`n\` points and print each one's \`repr\` with its distance from the origin (two decimals); then the farthest point (\`max\` with a key; first on ties); then that point reflected through the origin using \`_replace\`.

**Input:** \`n\`, then \`n\` lines \`x y\`.
**Output:** \`n\` lines \`Point(x=..., y=...) <dist>\`, then \`farthest: <repr>\`, then \`reflected: <repr>\`.

\`\`\`text
2
3 4
-1 0
\`\`\`
prints
\`\`\`text
Point(x=3, y=4) 5.00
Point(x=-1, y=0) 1.00
farthest: Point(x=3, y=4)
reflected: Point(x=-3, y=-4)
\`\`\``,
          starter: String.raw`import math
from collections import namedtuple

Point = namedtuple("Point", "x y")


def dist(p):
    return math.hypot(p.x, p.y)


n = int(input())
points = []
for _ in range(n):
    x, y = map(int, input().split())
    points.append(Point(x, y))
# TODO: print each point, the farthest, and its reflection
`,
          solution: String.raw`import math
from collections import namedtuple

Point = namedtuple("Point", "x y")


def dist(p):
    return math.hypot(p.x, p.y)


n = int(input())
points = []
for _ in range(n):
    x, y = map(int, input().split())
    points.append(Point(x, y))
for p in points:
    print(f"{p!r} {dist(p):.2f}")
far = max(points, key=dist)
print(f"farthest: {far!r}")
print(f"reflected: {far._replace(x=-far.x, y=-far.y)!r}")
`,
          hints: [
            "A named tuple's `repr` is `Point(x=3, y=4)` — `{p!r}` in the f-string prints it.",
            "`_replace` returns a new tuple with the named fields changed; the original is untouched.",
          ],
          cases: [
            { stdin: "2\n3 4\n-1 0\n", expected: "Point(x=3, y=4) 5.00\nPoint(x=-1, y=0) 1.00\nfarthest: Point(x=3, y=4)\nreflected: Point(x=-3, y=-4)\n" },
            { stdin: "1\n0 0\n", expected: "Point(x=0, y=0) 0.00\nfarthest: Point(x=0, y=0)\nreflected: Point(x=0, y=0)\n", hidden: true },
            { stdin: "3\n1 1\n-1 -1\n0 2\n", expected: "Point(x=1, y=1) 1.41\nPoint(x=-1, y=-1) 1.41\nPoint(x=0, y=2) 2.00\nfarthest: Point(x=0, y=2)\nreflected: Point(x=0, y=-2)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `type((1))` and `type((1,))`?",
          options: ["`tuple` and `tuple`", "`int` and `tuple`", "`int` and `int`", "`tuple` and `int`"],
          answer: 1,
          explanation: "Parentheses alone only group; the comma makes the tuple.",
        },
        {
          prompt: "What happens?\n\n```python\nt = ([1], 2)\nt[0].append(3)\nt[0] = [9]\n```",
          options: ["Both lines succeed", "The append succeeds; the assignment raises `TypeError`", "Both raise `TypeError`", "The append raises; the assignment succeeds"],
          answer: 1,
          explanation: "The tuple's slots cannot be rebound, but the list inside is an ordinary mutable object that can be changed through the tuple.",
        },
        {
          prompt: "What does `first, *rest = [1]` bind?",
          options: ["`first = 1, rest = []`", "`first = 1, rest = None`", "`ValueError`", "`first = [1], rest = []`"],
          answer: 0,
          explanation: "The starred target absorbs the surplus, which may be nothing — an empty list.",
        },
        {
          prompt: "Why does `a, b = b, a` swap correctly?",
          options: ["Python has a special swap instruction", "The right-hand tuple is fully built before any left-hand name is bound", "Because tuples are immutable", "It does not — it needs a temporary"],
          answer: 1,
          explanation: "Assignment evaluates the whole right side first, then binds left to right, so the old values are captured before either name changes.",
        },
        {
          prompt: "Which is true of `namedtuple`?",
          options: [
            "Its instances are mutable like dataclasses",
            "It is a tuple subclass with named fields, so unpacking and indexing still work and `_replace` returns a new instance",
            "Fields can only be accessed by name",
            "It cannot be used as a dictionary key",
          ],
          answer: 1,
          explanation: "A named tuple is still a tuple: immutable, hashable (if its fields are), indexable and unpackable, with attribute access added.",
        },
      ],
    },
    {
      slug: "grids-and-nested-lists",
      file: "05-grids-and-nested-lists.md",
      exercises: [
        {
          title: "One step of Life",
          prompt: `Read an \`R × C\` grid of \`#\` (live) and \`.\` (dead) cells and print the next generation of Conway's Game of Life: a live cell with 2 or 3 live neighbours (of its 8) stays alive, a dead cell with exactly 3 becomes alive, every other cell is dead. Use a direction list, a bounds check, and a **new** grid — never write into the grid you are reading.

**Input:** \`R C\`, then \`R\` rows.
**Output:** \`R\` rows.

\`\`\`text
3 3
.#.
.#.
.#.
\`\`\`
prints
\`\`\`text
...
###
...
\`\`\``,
          starter: String.raw`R, C = map(int, input().split())
grid = [input().rstrip("\n") for _ in range(R)]
DIRS = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0)]


def live_neighbours(r, c):
    # TODO: count '#' among in-bounds neighbours
    return 0


nxt = [["."] * C for _ in range(R)]
# TODO: fill nxt from grid and print it
`,
          solution: String.raw`R, C = map(int, input().split())
grid = [input().rstrip("\n") for _ in range(R)]
DIRS = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0)]


def live_neighbours(r, c):
    count = 0
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == "#":
            count += 1
    return count


nxt = [["."] * C for _ in range(R)]
for r in range(R):
    for c in range(C):
        n = live_neighbours(r, c)
        if grid[r][c] == "#" and n in (2, 3):
            nxt[r][c] = "#"
        elif grid[r][c] == "." and n == 3:
            nxt[r][c] = "#"
for row in nxt:
    print("".join(row))
`,
          hints: [
            "The bounds check `0 <= nr < R and 0 <= nc < C` must come before indexing.",
            "Reading `grid` and writing `nxt` keeps every decision based on the old generation.",
          ],
          cases: [
            { stdin: "3 3\n.#.\n.#.\n.#.\n", expected: "...\n###\n...\n" },
            { stdin: "2 2\n##\n##\n", expected: "##\n##\n", hidden: true },
            { stdin: "1 3\n###\n", expected: ".#.\n", hidden: true },
            { stdin: "4 4\n....\n.##.\n.#..\n....\n", expected: "....\n.##.\n.##.\n....\n", hidden: true },
          ],
        },
        {
          title: "Transpose and rotate",
          prompt: `Read an \`R × C\` grid of integers and print its transpose, then the grid rotated 90° clockwise, then the column sums — each built with \`zip(*...)\`. Separate the three blocks with a line \`--\`.

**Input:** \`R C\`, then \`R\` rows.
**Output:** the transpose (\`C\` rows), \`--\`, the rotation (\`C\` rows), \`--\`, one line of \`C\` column sums.

\`\`\`text
2 3
1 2 3
4 5 6
\`\`\`
prints
\`\`\`text
1 4
2 5
3 6
--
4 1
5 2
6 3
--
5 7 9
\`\`\``,
          starter: String.raw`R, C = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(R)]


def show(rows):
    for row in rows:
        print(" ".join(map(str, row)))


# TODO: transposed = zip(*grid); rotated = zip(*grid[::-1]); sums = [sum(col) for col in zip(*grid)]
`,
          solution: String.raw`R, C = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(R)]


def show(rows):
    for row in rows:
        print(" ".join(map(str, row)))


show(zip(*grid))
print("--")
show(zip(*grid[::-1]))
print("--")
print(" ".join(str(sum(col)) for col in zip(*grid)))
`,
          hints: [
            "`zip(*grid)` yields the columns as tuples — printing them row by row is the transpose.",
            "Reversing the rows before transposing rotates clockwise.",
          ],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n", expected: "1 4\n2 5\n3 6\n--\n4 1\n5 2\n6 3\n--\n5 7 9\n" },
            { stdin: "1 1\n7\n", expected: "7\n--\n7\n--\n7\n", hidden: true },
            { stdin: "3 2\n1 2\n3 4\n5 6\n", expected: "1 3 5\n2 4 6\n--\n5 3 1\n6 4 2\n--\n9 12\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the right way to build a 3×4 grid of zeros?",
          options: ["`[[0] * 4] * 3`", "`[[0] * 4 for _ in range(3)]`", "`[0] * 12`", "`[[0, 0, 0]] * 4`"],
          answer: 1,
          explanation: "The comprehension creates a fresh row each time; `* 3` would repeat one shared row.",
        },
        {
          prompt: "What does `list(zip(*[[1, 2], [3, 4]]))` produce?",
          options: ["`[(1, 3), (2, 4)]`", "`[(1, 2), (3, 4)]`", "`[[1, 3], [2, 4]]`", "`[(1, 2, 3, 4)]`"],
          answer: 0,
          explanation: "The star passes each row as an argument; `zip` pairs first elements, then second — the transpose, as tuples.",
        },
        {
          prompt: "Why must a neighbour check test `0 <= nr` and not just `nr < R`?",
          options: ["Because `grid[-1]` raises `IndexError`", "Because a negative index silently wraps to the last row instead of failing", "It need not — negative rows are impossible", "Because `R` may be zero"],
          answer: 1,
          explanation: "`grid[-1][c]` is valid Python and returns the last row, so a missing lower-bound check produces wrong answers rather than an error.",
        },
        {
          prompt: "Which prints a row of integers as `1 2 3`?",
          options: ["`print(row)`", "`print(\" \".join(map(str, row)))`", "`print(\" \".join(row))`", "`print(*row, sep=\"\")`"],
          answer: 1,
          explanation: "`join` needs strings, hence `map(str, …)`; `print(row)` shows brackets; `sep=\"\"` would give `123`.",
        },
        {
          prompt: "In a row-major flat list of an `R × C` grid, which index holds cell `(r, c)`?",
          options: ["`r * C + c`", "`c * R + r`", "`r + c`", "`r * R + c`"],
          answer: 0,
          explanation: "Each row contributes `C` cells, so `r` full rows precede the cell, then `c` more.",
        },
      ],
    },
    {
      slug: "sequence-tools",
      file: "06-sequence-tools.md",
      exercises: [
        {
          title: "Sliding window maxima",
          prompt: `Read a window size \`k\` and a line of integers. Slide a \`collections.deque(maxlen=k)\` over the values; for every position where the window is full, print its maximum and its mean (two decimals). If there are fewer than \`k\` values print \`no full window\`.

**Input:** \`k\`, then a line of integers.
**Output:** \`max <m> mean <a>\` per full window, or \`no full window\`.

\`\`\`text
3
1 3 2 5 4
\`\`\`
prints
\`\`\`text
max 3 mean 2.00
max 5 mean 3.33
max 5 mean 3.67
\`\`\``,
          starter: String.raw`from collections import deque

k = int(input())
xs = list(map(int, input().split()))
window = deque(maxlen=k)
full = 0
for x in xs:
    window.append(x)
    # TODO: when len(window) == k print max and mean
if not full:
    print("no full window")
`,
          solution: String.raw`from collections import deque

k = int(input())
xs = list(map(int, input().split()))
window = deque(maxlen=k)
full = 0
for x in xs:
    window.append(x)
    if len(window) == k:
        full += 1
        print(f"max {max(window)} mean {sum(window) / k:.2f}")
if not full:
    print("no full window")
`,
          hints: [
            "A bounded deque drops its oldest element automatically once it holds `maxlen` items.",
            "`max` and `sum` accept a deque directly.",
          ],
          cases: [
            { stdin: "3\n1 3 2 5 4\n", expected: "max 3 mean 2.00\nmax 5 mean 3.33\nmax 5 mean 3.67\n" },
            { stdin: "1\n4 -2\n", expected: "max 4 mean 4.00\nmax -2 mean -2.00\n", hidden: true },
            { stdin: "4\n1 2 3\n", expected: "no full window\n", hidden: true },
            { stdin: "2\n5 5 5\n", expected: "max 5 mean 5.00\nmax 5 mean 5.00\n", hidden: true },
          ],
        },
        {
          title: "A sequence of your own",
          prompt: `Implement \`Squares(n)\`, the sequence of the first \`n\` squares \`0, 1, 4, …\`, with only \`__len__\` and \`__getitem__\` (supporting negative indexes and raising \`IndexError\` past the ends). Then let the built-ins do the rest: print its length, its first and last elements, the whole sequence via \`list\`, whether a query value is \`in\` it, and it reversed via \`reversed\`.

**Input:** \`n q\`.
**Output:** \`len <n>\`, \`first <v> last <v>\`, \`all <values>\`, \`<q> in: <True/False>\`, \`reversed <values>\`.

\`\`\`text
4 9
\`\`\`
prints
\`\`\`text
len 4
first 0 last 9
all 0 1 4 9
9 in: True
reversed 9 4 1 0
\`\`\``,
          starter: String.raw`class Squares:
    def __init__(self, n):
        self.n = n

    # TODO: __len__ and __getitem__


n, q = map(int, input().split())
s = Squares(n)
print(f"len {len(s)}")
print(f"first {s[0]} last {s[-1]}")
print("all", " ".join(map(str, list(s))))
print(f"{q} in: {q in s}")
print("reversed", " ".join(map(str, reversed(s))))
`,
          solution: String.raw`class Squares:
    def __init__(self, n):
        self.n = n

    def __len__(self):
        return self.n

    def __getitem__(self, i):
        if i < 0:
            i += self.n
        if not 0 <= i < self.n:
            raise IndexError(i)
        return i * i


n, q = map(int, input().split())
s = Squares(n)
print(f"len {len(s)}")
print(f"first {s[0]} last {s[-1]}")
print("all", " ".join(map(str, list(s))))
print(f"{q} in: {q in s}")
print("reversed", " ".join(map(str, reversed(s))))
`,
          hints: [
            "Normalise a negative index by adding the length, then range-check and raise `IndexError`.",
            "Iteration, `in` and `reversed` all fall back on `__len__` and `__getitem__` — nothing else is needed.",
          ],
          cases: [
            { stdin: "4 9\n", expected: "len 4\nfirst 0 last 9\nall 0 1 4 9\n9 in: True\nreversed 9 4 1 0\n" },
            { stdin: "1 5\n", expected: "len 1\nfirst 0 last 0\nall 0\n5 in: False\nreversed 0\n", hidden: true },
            { stdin: "6 25\n", expected: "len 6\nfirst 0 last 25\nall 0 1 4 9 16 25\n25 in: True\nreversed 25 16 9 4 1 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `all([])` return?",
          options: ["`False`", "`True`", "`None`", "`ValueError`"],
          answer: 1,
          explanation: "Vacuous truth: no element is falsy. `any([])` is `False`. Check emptiness separately when it matters.",
        },
        {
          prompt: "Which structure gives O(1) removal from the front?",
          options: ["`list`", "`collections.deque`", "`tuple`", "`array.array`"],
          answer: 1,
          explanation: "`deque.popleft()` is constant time; `list.pop(0)` shifts every remaining element.",
        },
        {
          prompt: "What does `list(zip(xs, xs[1:]))` produce for `xs = [1, 2, 3]`?",
          options: ["`[(1, 2), (2, 3)]`", "`[(1, 2), (2, 3), (3, None)]`", "`[(1, 1), (2, 2), (3, 3)]`", "`[(2, 1), (3, 2)]`"],
          answer: 0,
          explanation: "Each element is paired with its successor; `zip` stops at the shorter slice. `itertools.pairwise` does the same.",
        },
        {
          prompt: "What happens after `r = reversed(xs); list(r); list(r)`?",
          options: ["Both lists are the reversed `xs`", "The second list is empty — `reversed` returns a one-shot iterator", "`TypeError`", "The second list is `xs` in original order"],
          answer: 1,
          explanation: "`reversed` gives an iterator that is exhausted after one pass; `xs[::-1]` gives a reusable list.",
        },
        {
          prompt: "A class defines only `__len__` and `__getitem__` (raising `IndexError` past the end). Which of these work on its instances?",
          options: ["Only `len` and indexing", "`len`, indexing, `for`, `in`, `list()`, `reversed()`", "Nothing until `__iter__` is defined", "Only `for` loops"],
          answer: 1,
          explanation: "Iteration falls back on indexing from 0 until `IndexError`; membership falls back on iteration; `reversed` uses both methods.",
        },
      ],
    },
    {
      slug: "sequences-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Inventory report",
          prompt: `Keep an inventory from commands read until \`report\`: \`add name qty price\` adds an item (or replaces an existing one), \`remove name\` deletes it (\`unknown item\` if absent), \`restock name qty\` adds to its quantity (\`unknown item\` if absent). On \`report\` print the items ordered by quantity descending then name ascending, as a table: name left-aligned in 10, quantity right-aligned in 5, price right-aligned in 8 with two decimals, value (\`qty * price\`) right-aligned in 10 with two decimals; then \`TOTAL\` with the total value in the last column.

**Input:** commands.
**Output:** the error lines as they occur, then the table.

\`\`\`text
add bolt 100 0.05
add nut 250 0.02
restock bolt 50
remove screw
report
\`\`\`
prints
\`\`\`text
unknown item
nut         250    0.02      5.00
bolt        150    0.05      7.50
TOTAL                       12.50
\`\`\``,
          starter: String.raw`import sys

items = {}  # name -> [qty, price]
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "report":
        break
    # TODO: add / remove / restock

rows = []  # TODO: (name, qty, price) sorted by (-qty, name)
total = 0.0
for name, qty, price in rows:
    value = qty * price
    total += value
    print(f"{name:<10}{qty:>5}{price:>8.2f}{value:>10.2f}")
print(f"{'TOTAL':<10}{'':>5}{'':>8}{total:>10.2f}")
`,
          solution: String.raw`import sys

items = {}  # name -> [qty, price]
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "report":
        break
    if cmd == "add":
        items[args[0]] = [int(args[1]), float(args[2])]
    elif cmd == "remove":
        if args[0] in items:
            del items[args[0]]
        else:
            print("unknown item")
    elif cmd == "restock":
        if args[0] in items:
            items[args[0]][0] += int(args[1])
        else:
            print("unknown item")

rows = sorted(((name, qty, price) for name, (qty, price) in items.items()), key=lambda r: (-r[1], r[0]))
total = 0.0
for name, qty, price in rows:
    value = qty * price
    total += value
    print(f"{name:<10}{qty:>5}{price:>8.2f}{value:>10.2f}")
print(f"{'TOTAL':<10}{'':>5}{'':>8}{total:>10.2f}")
`,
          hints: [
            "Store each item as a two-element list so `restock` can change the quantity in place.",
            "The sort key `(-qty, name)` gives quantity descending with names ascending on ties.",
          ],
          cases: [
            { stdin: "add bolt 100 0.05\nadd nut 250 0.02\nrestock bolt 50\nremove screw\nreport\n", expected: "unknown item\nnut         250    0.02      5.00\nbolt        150    0.05      7.50\nTOTAL                       12.50\n" },
            { stdin: "report\n", expected: "TOTAL                        0.00\n", hidden: true },
            { stdin: "add a 1 1\nadd b 1 2\nadd a 3 1\nremove b\nrestock c 1\nreport\n", expected: "unknown item\na             3    1.00      3.00\nTOTAL                        3.00\n", hidden: true },
          ],
        },
        {
          title: "Islands",
          prompt: `Count the islands in an \`R × C\` grid of \`#\` (land) and \`.\` (water), where land cells are connected horizontally or vertically. Use an explicit stack (a list with \`append\`/\`pop\`) to flood each island from its first unvisited cell, with a direction list and a bounds check, and a \`visited\` grid built with a comprehension. Print the number of islands and the size of the largest.

**Input:** \`R C\`, then \`R\` rows.
**Output:** \`islands <n>\` then \`largest <size>\` (0 when there is no land).

\`\`\`text
3 4
##..
#..#
..##
\`\`\`
prints
\`\`\`text
islands 2
largest 3
\`\`\``,
          starter: String.raw`R, C = map(int, input().split())
grid = [input().rstrip("\n") for _ in range(R)]
visited = [[False] * C for _ in range(R)]
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def flood(r, c):
    # TODO: iterative flood fill from (r, c); return the island size
    return 0


islands = 0
largest = 0
# TODO: scan every cell; flood unvisited land
print(f"islands {islands}")
print(f"largest {largest}")
`,
          solution: String.raw`R, C = map(int, input().split())
grid = [input().rstrip("\n") for _ in range(R)]
visited = [[False] * C for _ in range(R)]
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def flood(r, c):
    stack = [(r, c)]
    visited[r][c] = True
    size = 0
    while stack:
        cr, cc = stack.pop()
        size += 1
        for dr, dc in DIRS:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == "#" and not visited[nr][nc]:
                visited[nr][nc] = True
                stack.append((nr, nc))
    return size


islands = 0
largest = 0
for r in range(R):
    for c in range(C):
        if grid[r][c] == "#" and not visited[r][c]:
            islands += 1
            largest = max(largest, flood(r, c))
print(f"islands {islands}")
print(f"largest {largest}")
`,
          hints: [
            "Mark a cell visited when you push it, not when you pop it, or it can be pushed twice.",
            "The outer scan starts a flood only from unvisited land; each flood returns its size.",
          ],
          cases: [
            { stdin: "3 4\n##..\n#..#\n..##\n", expected: "islands 2\nlargest 3\n" },
            { stdin: "2 2\n..\n..\n", expected: "islands 0\nlargest 0\n", hidden: true },
            { stdin: "3 3\n#.#\n.#.\n#.#\n", expected: "islands 5\nlargest 1\n", hidden: true },
            { stdin: "2 5\n#####\n#####\n", expected: "islands 1\nlargest 10\n", hidden: true },
          ],
        },
        {
          title: "Live leaderboard",
          prompt: `Scores arrive one per line as \`name score\`. Keep a list of \`(-score, name)\` tuples sorted at all times with \`bisect.insort\`, and after every arrival print the current top three names, comma-separated (fewer if there are fewer entries). A name may appear again with a new score: remove its old entry first.

**Input:** lines \`name score\`.
**Output:** one line per input line.

\`\`\`text
ada 50
bob 70
cy 60
ada 80
\`\`\`
prints
\`\`\`text
ada
bob,ada
bob,cy,ada
ada,bob,cy
\`\`\``,
          starter: String.raw`import bisect
import sys

board = []       # sorted list of (-score, name)
current = {}     # name -> score
for line in sys.stdin:
    name, score = line.split()
    score = int(score)
    # TODO: remove the old entry if present, insort the new one, print the top three
`,
          solution: String.raw`import bisect
import sys

board = []       # sorted list of (-score, name)
current = {}     # name -> score
for line in sys.stdin:
    name, score = line.split()
    score = int(score)
    if name in current:
        board.remove((-current[name], name))
    current[name] = score
    bisect.insort(board, (-score, name))
    print(",".join(name for _, name in board[:3]))
`,
          hints: [
            "Storing `(-score, name)` makes ascending order mean highest score first with names alphabetical on ties.",
            "`list.remove` takes the exact old tuple, which you can rebuild from the `current` dictionary.",
          ],
          cases: [
            { stdin: "ada 50\nbob 70\ncy 60\nada 80\n", expected: "ada\nbob,ada\nbob,cy,ada\nada,bob,cy\n" },
            { stdin: "x 1\ny 1\nz 1\nw 1\n", expected: "x\nx,y\nx,y,z\nw,x,y\n", hidden: true },
            { stdin: "a 9\na 1\n", expected: "a\na\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `xs[::-1]` return for a list, and does it modify `xs`?",
          options: ["A reversed copy; no", "A reversed view; yes", "It reverses in place and returns `None`", "An iterator"],
          answer: 0,
          explanation: "Slicing always creates a new list. `xs.reverse()` is the in-place version and returns `None`.",
        },
        {
          prompt: "What is `[x for x in range(6) if x % 2 for _ in range(2)]`?",
          options: ["`[1, 1, 3, 3, 5, 5]`", "`[1, 3, 5]`", "`SyntaxError`", "`[0, 0, 2, 2, 4, 4]`"],
          answer: 0,
          explanation: "The filter applies to the outer loop, and the inner `for` repeats each surviving value twice. Clauses read left to right.",
        },
        {
          prompt: "Which builds the dictionary `{'a': 1, 'b': 2}` from `keys = ['a', 'b']` and `vals = [1, 2]`?",
          options: ["`dict(zip(keys, vals))`", "`{keys: vals}`", "`dict(keys, vals)`", "`zip(keys, vals)`"],
          answer: 0,
          explanation: "`zip` pairs the elements and `dict` consumes the pairs; `{k: v for k, v in zip(keys, vals)}` is the comprehension form.",
        },
        {
          prompt: "What is `sorted([(2, 'b'), (1, 'z'), (2, 'a')])`?",
          options: ["`[(1, 'z'), (2, 'a'), (2, 'b')]`", "`[(1, 'z'), (2, 'b'), (2, 'a')]`", "`[(2, 'a'), (2, 'b'), (1, 'z')]`", "`TypeError`"],
          answer: 0,
          explanation: "Tuples compare element by element, so ties on the number are broken by the string.",
        },
        {
          prompt: "What does `bisect.insort(xs, 4)` do to a sorted `xs = [1, 3, 5]`?",
          options: ["Returns `2` and leaves `xs` alone", "Inserts 4 keeping order: `xs` becomes `[1, 3, 4, 5]`", "Appends 4: `[1, 3, 5, 4]`", "Raises because 4 is not present"],
          answer: 1,
          explanation: "`insort` finds the position by binary search and inserts there. `bisect_left` would only return the position.",
        },
        {
          prompt: "What does `a, (b, c) = 1, (2, 3)` bind?",
          options: ["`a=1, b=2, c=3`", "`a=1, b=(2, 3), c=None`", "`ValueError`", "`SyntaxError`"],
          answer: 0,
          explanation: "Unpacking targets nest; the inner tuple target unpacks the inner tuple value.",
        },
        {
          prompt: "Why is `row = [0] * 3; grid = [row, row, row]` a bug?",
          options: ["It is not — the rows are copied", "All three rows are the same list; changing one cell changes every row", "Lists cannot contain lists", "`* 3` is not allowed on lists"],
          answer: 1,
          explanation: "The same object appears three times. `[[0] * 3 for _ in range(3)]` builds separate rows.",
        },
        {
          prompt: "What is `list(zip(*[(1, 'a'), (2, 'b')]))`?",
          options: ["`[(1, 2), ('a', 'b')]`", "`[(1, 'a'), (2, 'b')]`", "`[1, 2, 'a', 'b']`", "`[(1, 'a', 2, 'b')]`"],
          answer: 0,
          explanation: "Transposing a list of pairs 'unzips' it into the firsts and the seconds.",
        },
        {
          prompt: "Which deque method drops the oldest element automatically?",
          options: ["`popleft()` must be called by hand", "None — but `deque(maxlen=k)` discards the opposite end on `append` once full", "`rotate()`", "`clear()`"],
          answer: 1,
          explanation: "A bounded deque keeps at most `maxlen` items; appending to a full one evicts from the other end.",
        },
        {
          prompt: "What does `max([\"apple\", \"fig\", \"banana\"], key=len)` return?",
          options: ["`'banana'`", "`'apple'`", "`6`", "`'fig'`"],
          answer: 0,
          explanation: "The key compares lengths; the element with the greatest length is returned, not the length itself.",
        },
        {
          prompt: "What does `t = (1, 2); t += (3,)` do?",
          options: ["Mutates the tuple in place", "Creates a new tuple `(1, 2, 3)` and rebinds `t`", "`TypeError`", "Creates `(1, 2, (3,))`"],
          answer: 1,
          explanation: "Tuples are immutable; `+=` falls back to `t = t + (3,)`, a fresh object.",
        },
        {
          prompt: "A class defines `__getitem__` that never raises `IndexError`. What happens on `list(obj)`?",
          options: ["An empty list", "An infinite loop — iteration by indexing stops only at `IndexError`", "`TypeError`", "A list of one element"],
          answer: 1,
          explanation: "The fallback iteration protocol calls `obj[0]`, `obj[1]`, … until `IndexError`; without it, it never stops.",
        },
      ],
    },
  ],
});
