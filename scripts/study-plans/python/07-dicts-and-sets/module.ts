import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "dicts-and-sets",
  title: "Dictionaries and sets",
  blurb: "Dictionaries with get, setdefault, views and merging, counting and grouping with Counter and defaultdict, sets and their algebra, the hashing contract that decides what can be a key, nested data and JSON, and the complexity table with heapq.",
  icon: "list",
  overview: `The dictionary is the structure Python is built from — namespaces, attributes and keyword arguments are all dicts — and the one a program reaches for whenever it needs to find something by name in constant time. This module teaches it thoroughly, then the two \`collections\` types that name the commonest dict jobs (\`Counter\` for counting, \`defaultdict\` for grouping), the set as the membership and algebra structure, and the hashing mechanism underneath both, which explains why a list cannot be a key, why string hashes are randomised, and what a class must define to be a key.

Dictionaries covers construction, \`d[k]\` versus \`get\` versus \`in\` versus \`setdefault\`, views, merging with \`|\`, and the rule against resizing during iteration. Counting and grouping gives \`Counter\` and \`defaultdict\` with the plain-dict spellings and the reason \`itertools.groupby\` is not a grouping tool. Sets covers the operations, \`frozenset\`, and the ordering caveat that decides how a set is printed. Hashing and keys explains the slot mechanism, the equality contract and \`__eq__\`/\`__hash__\`. Nested data and JSON covers \`loads\`/\`dumps\`, safe navigation, recursive walks and deterministic output with \`sort_keys\`. Choosing a collection gives the complexity table, the decision rules and \`heapq\`.

The exercises are whole programs: a phone book, a configuration merge that reports overrides, word frequencies with an explicit tie-break, grouping by department, set algebra over two lists, deduplication with and without order, points as tuple keys, a hashable value class, a recursive JSON walk, a canonical JSON printer, a priority queue on \`heapq\`, and top-k selection. The checkpoint adds a word-frequency report, a two-snapshot diff built on set algebra, and a scheduler that pops the highest-priority job from a heap of tuples.`,
  lessons: [
    {
      slug: "dictionaries",
      file: "01-dictionaries.md",
      exercises: [
        {
          title: "Phone book",
          prompt: `Keep a phone book from commands read until the end of input: \`add name number\` stores or replaces; \`find name\` prints the number or \`not found\`; \`remove name\` prints \`removed\` or \`not found\`; \`list\` prints every entry as \`name: number\` in name order. Use \`get\` for lookups, \`pop\` with a default for removal, and never raise \`KeyError\`.

**Input:** commands.
**Output:** one line per \`find\`, \`remove\` and per entry of \`list\`.

\`\`\`text
add ada 100
add bob 200
find ada
find cy
remove bob
remove bob
list
\`\`\`
prints
\`\`\`text
100
not found
removed
not found
ada: 100
\`\`\``,
          starter: String.raw`import sys

book = {}
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: add / find / remove / list
`,
          solution: String.raw`import sys

book = {}
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "add":
        book[args[0]] = args[1]
    elif cmd == "find":
        print(book.get(args[0], "not found"))
    elif cmd == "remove":
        print("removed" if book.pop(args[0], None) is not None else "not found")
    elif cmd == "list":
        for name in sorted(book):
            print(f"{name}: {book[name]}")
`,
          hints: [
            "`book.get(name, \"not found\")` returns the default instead of raising.",
            "`book.pop(name, None)` removes and returns the value, or `None` when absent — test that to choose the message.",
          ],
          cases: [
            { stdin: "add ada 100\nadd bob 200\nfind ada\nfind cy\nremove bob\nremove bob\nlist\n", expected: "100\nnot found\nremoved\nnot found\nada: 100\n" },
            { stdin: "list\nfind x\n", expected: "not found\n", hidden: true },
            { stdin: "add z 1\nadd a 2\nadd z 3\nlist\n", expected: "a: 2\nz: 3\n", hidden: true },
          ],
        },
        {
          title: "Merge with overrides",
          prompt: `The first line holds default settings as \`key=value\` pairs, the second the user's settings in the same form (either may be empty). Merge them with the \`|\` operator so the user's values win, print the merged settings in the order the operator produces (defaults' order, then new user keys), and then the keys whose value the user **changed**, sorted.

**Input:** two lines.
**Output:** \`key=value\` per merged entry, then \`overridden: <keys>\` or \`overridden: none\`.

\`\`\`text
theme=light size=12 lang=en
size=14 lang=en font=mono
\`\`\`
prints
\`\`\`text
theme=light
size=14
lang=en
font=mono
overridden: size
\`\`\``,
          starter: String.raw`def parse(line):
    return dict(tok.split("=", 1) for tok in line.split())


defaults = parse(input())
user = parse(input())
merged = {}  # TODO: defaults | user
# TODO: print merged and the overridden keys
`,
          solution: String.raw`def parse(line):
    return dict(tok.split("=", 1) for tok in line.split())


defaults = parse(input())
user = parse(input())
merged = defaults | user
for key, value in merged.items():
    print(f"{key}={value}")
overridden = sorted(k for k in defaults.keys() & user.keys() if defaults[k] != user[k])
print("overridden:", " ".join(overridden) if overridden else "none")
`,
          hints: [
            "`defaults | user` keeps the left dict's key order and appends keys only the right one has.",
            "`defaults.keys() & user.keys()` is the set of shared keys — compare their values to find real changes.",
          ],
          cases: [
            { stdin: "theme=light size=12 lang=en\nsize=14 lang=en font=mono\n", expected: "theme=light\nsize=14\nlang=en\nfont=mono\noverridden: size\n" },
            { stdin: "a=1\n\n", expected: "a=1\noverridden: none\n", hidden: true },
            { stdin: "\nb=2 a=1\n", expected: "b=2\na=1\noverridden: none\n", hidden: true },
            { stdin: "x=1 y=2\ny=3 x=0\n", expected: "x=0\ny=3\noverridden: x y\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `d = {}; d[\"a\"] += 1` do?",
          options: ["Sets `d[\"a\"]` to 1", "Raises `KeyError`", "Sets `d[\"a\"]` to `None`", "Raises `TypeError`"],
          answer: 1,
          explanation: "Augmented assignment reads the key first, and it is missing. Use `d[\"a\"] = d.get(\"a\", 0) + 1`, a `defaultdict(int)` or a `Counter`.",
        },
        {
          prompt: "What is `d.setdefault(\"k\", []).append(1)` equivalent to?",
          options: [
            "Replace `d[\"k\"]` with `[1]`",
            "If `\"k\"` is absent store `[]` under it; then append 1 to whatever list is stored",
            "Append 1 only if `\"k\"` exists",
            "Raise `KeyError` when `\"k\"` is absent",
          ],
          answer: 1,
          explanation: "`setdefault` inserts the default only when the key is missing and returns the stored value either way, so the append always lands on the dict's list.",
        },
        {
          prompt: "What does `{**a, **b}` do when `a` and `b` share a key?",
          options: ["Raises `KeyError`", "Keeps `a`'s value", "Keeps `b`'s value — later mappings win", "Stores both in a list"],
          answer: 2,
          explanation: "Merges are left to right and later entries overwrite; `a | b` behaves the same way.",
        },
        {
          prompt: "What happens here?\n\n```python\nfor k in d:\n    if k.startswith(\"_\"):\n        del d[k]\n```",
          options: ["The keys are removed", "`RuntimeError: dictionary changed size during iteration`", "Only the first matching key is removed", "`KeyError`"],
          answer: 1,
          explanation: "Resizing a dict while iterating it is detected and refused. Iterate over `list(d)` or build a filtered copy with a comprehension.",
        },
        {
          prompt: "What does `d.keys()` return?",
          options: ["A list of keys", "A live view that supports `len`, `in` and set operations, but not indexing", "A tuple of keys", "An iterator that can be consumed once"],
          answer: 1,
          explanation: "Views reflect later changes to the dict and behave like sets for keys and items; `list(d.keys())` materialises them when indexing is needed.",
        },
      ],
    },
    {
      slug: "counting-and-grouping",
      file: "02-counting-and-grouping.md",
      exercises: [
        {
          title: "Word frequencies",
          prompt: `Read text until the end of input and count words (case-folded, with leading and trailing punctuation stripped; empty results ignored) with a \`Counter\`. Read \`k\` from the first line. Print the \`k\` most frequent words as \`word count\`, ordering ties **alphabetically** (so sort explicitly rather than relying on \`most_common\`), then the number of words that occur exactly once.

**Input:** \`k\`, then lines of text.
**Output:** up to \`k\` lines, then \`once: <n>\`.

\`\`\`text
2
the cat and the hat. The end, and... fin
\`\`\`
prints
\`\`\`text
the 3
and 2
once: 4
\`\`\``,
          starter: String.raw`import string
import sys
from collections import Counter

k = int(input())
counts = Counter()
for line in sys.stdin:
    # TODO: normalise the words and update the counter
    pass
# TODO: top k with (-count, word) ordering, then the once count
`,
          solution: String.raw`import string
import sys
from collections import Counter

k = int(input())
counts = Counter()
for line in sys.stdin:
    words = (w.casefold().strip(string.punctuation) for w in line.split())
    counts.update(w for w in words if w)
ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
for word, n in ranked[:k]:
    print(word, n)
print(f"once: {sum(1 for n in counts.values() if n == 1)}")
`,
          hints: [
            "`counts.update(iterable)` adds every element; a generator that filters empties keeps punctuation-only tokens out.",
            "Sort `counts.items()` by `(-count, word)`: descending count, then ascending word.",
          ],
          cases: [
            { stdin: "2\nthe cat and the hat. The end, and... fin\n", expected: "the 3\nand 2\nonce: 4\n" },
            { stdin: "3\nb a c\na b\n", expected: "a 2\nb 2\nc 1\nonce: 1\n", hidden: true },
            { stdin: "5\n\n", expected: "once: 0\n", hidden: true },
            { stdin: "1\n!!! ??? x\n", expected: "x 1\nonce: 1\n", hidden: true },
          ],
        },
        {
          title: "Group by department",
          prompt: `Read lines \`name dept\` until the end of input and group the names by department with a \`defaultdict(list)\`. Print each department in alphabetical order with its names sorted and comma-separated, then the largest department (ties broken alphabetically).

**Input:** lines.
**Output:** \`<dept>: <names>\` per department, then \`largest: <dept>\` (or \`largest: none\`).

\`\`\`text
ada eng
bob ops
cy eng
\`\`\`
prints
\`\`\`text
eng: ada,cy
ops: bob
largest: eng
\`\`\``,
          starter: String.raw`import sys
from collections import defaultdict

groups = defaultdict(list)
for line in sys.stdin:
    name, dept = line.split()
    # TODO
# TODO: print groups and the largest
`,
          solution: String.raw`import sys
from collections import defaultdict

groups = defaultdict(list)
for line in sys.stdin:
    name, dept = line.split()
    groups[dept].append(name)
for dept in sorted(groups):
    print(f"{dept}: {','.join(sorted(groups[dept]))}")
if groups:
    print("largest:", min(groups, key=lambda d: (-len(groups[d]), d)))
else:
    print("largest: none")
`,
          hints: [
            "`groups[dept].append(name)` works on the first access — the factory creates the list.",
            "`min` with the key `(-size, name)` picks the largest group and the alphabetically first on ties.",
          ],
          cases: [
            { stdin: "ada eng\nbob ops\ncy eng\n", expected: "eng: ada,cy\nops: bob\nlargest: eng\n" },
            { stdin: "", expected: "largest: none\n", hidden: true },
            { stdin: "z b\ny a\n", expected: "a: y\nb: z\nlargest: a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `Counter(\"aab\")[\"z\"]`?",
          options: ["`KeyError`", "`0`", "`None`", "`-1`"],
          answer: 1,
          explanation: "A `Counter` returns 0 for a missing key rather than raising, which is what makes `c[x] += 1` work unconditionally.",
        },
        {
          prompt: "What does `groups = defaultdict(list); print(\"x\" in groups); groups[\"x\"]; print(\"x\" in groups)` print?",
          options: ["`False` then `False`", "`False` then `True`", "`True` then `True`", "`KeyError`"],
          answer: 1,
          explanation: "Reading a missing key through `[]` calls the factory and *stores* the result, so the key now exists. `in` never inserts.",
        },
        {
          prompt: "How does `Counter.most_common()` order ties?",
          options: ["Alphabetically", "In the order the keys were first inserted", "Randomly", "By key hash"],
          answer: 1,
          explanation: "The sort is stable over insertion order. For an alphabetical tie-break, sort `items()` by `(-count, key)` yourself.",
        },
        {
          prompt: "What does `itertools.groupby(\"aabab\")` produce?",
          options: ["Two groups: all the `a`s and all the `b`s", "Four groups of consecutive runs: `aa`, `b`, `a`, `b`", "A dict", "`TypeError`"],
          answer: 1,
          explanation: "`groupby` groups consecutive equal keys only. For whole-data grouping, sort first or use `defaultdict(list)`.",
        },
        {
          prompt: "Which builds a nested counter usable as `t[a][b] += 1` without `KeyError`?",
          options: ["`defaultdict(int)`", "`defaultdict(lambda: defaultdict(int))`", "`defaultdict(dict)`", "`Counter(Counter)`"],
          answer: 1,
          explanation: "The outer factory must return an inner `defaultdict(int)`; `defaultdict(dict)` would give a plain dict whose missing keys raise.",
        },
      ],
    },
    {
      slug: "sets",
      file: "03-sets.md",
      exercises: [
        {
          title: "Set algebra",
          prompt: `Read two lines of tokens \`A\` and \`B\` and print, each sorted and space-separated (or \`(none)\`): the union, the intersection, \`A - B\`, \`B - A\` and the symmetric difference; then \`A <= B: True/False\` and \`disjoint: True/False\`.

**Input:** two lines.
**Output:** seven lines with the labels shown.

\`\`\`text
a b c
b c d
\`\`\`
prints
\`\`\`text
union: a b c d
intersection: b c
A-B: a
B-A: d
symmetric: a d
A <= B: False
disjoint: False
\`\`\``,
          starter: String.raw`A = set(input().split())
B = set(input().split())


def show(label, items):
    print(f"{label}: {' '.join(sorted(items)) if items else '(none)'}")


# TODO: the five set operations, then the two flags
`,
          solution: String.raw`A = set(input().split())
B = set(input().split())


def show(label, items):
    print(f"{label}: {' '.join(sorted(items)) if items else '(none)'}")


show("union", A | B)
show("intersection", A & B)
show("A-B", A - B)
show("B-A", B - A)
show("symmetric", A ^ B)
print(f"A <= B: {A <= B}")
print(f"disjoint: {A.isdisjoint(B)}")
`,
          hints: [
            "Every set goes through `sorted` before printing — never print a set directly.",
            "`A <= B` is the subset test; `isdisjoint` is a method with no operator.",
          ],
          cases: [
            { stdin: "a b c\nb c d\n", expected: "union: a b c d\nintersection: b c\nA-B: a\nB-A: d\nsymmetric: a d\nA <= B: False\ndisjoint: False\n" },
            { stdin: "x\nx y\n", expected: "union: x y\nintersection: x\nA-B: (none)\nB-A: y\nsymmetric: y\nA <= B: True\ndisjoint: False\n", hidden: true },
            { stdin: "\n\n", expected: "union: (none)\nintersection: (none)\nA-B: (none)\nB-A: (none)\nsymmetric: (none)\nA <= B: True\ndisjoint: True\n", hidden: true },
          ],
        },
        {
          title: "Deduplicate three ways",
          prompt: `Read a line of positive integers. Print the number of distinct values; the distinct values in **first-seen order** (via \`dict.fromkeys\`); the values that occur more than once, sorted; and the values from 1 to the maximum that are missing, sorted (via set difference).

**Input:** one line of positive integers (at least one).
**Output:** \`distinct: <n>\`, \`ordered: <values>\`, \`dups: <values>\` (or \`(none)\`), \`missing: <values>\` (or \`(none)\`).

\`\`\`text
3 1 3 5 1
\`\`\`
prints
\`\`\`text
distinct: 3
ordered: 3 1 5
dups: 1 3
missing: 2 4
\`\`\``,
          starter: String.raw`xs = list(map(int, input().split()))


def show(label, items):
    print(f"{label}: {' '.join(map(str, items)) if items else '(none)'}")


# TODO: distinct count, ordered dedupe, duplicates (a seen-set pass), missing via set difference
`,
          solution: String.raw`xs = list(map(int, input().split()))


def show(label, items):
    print(f"{label}: {' '.join(map(str, items)) if items else '(none)'}")


print(f"distinct: {len(set(xs))}")
show("ordered", list(dict.fromkeys(xs)))
seen, dups = set(), set()
for x in xs:
    if x in seen:
        dups.add(x)
    seen.add(x)
show("dups", sorted(dups))
show("missing", sorted(set(range(1, max(xs) + 1)) - set(xs)))
`,
          hints: [
            "`dict.fromkeys(xs)` keeps the first occurrence of each value in order; its keys are the answer.",
            "One pass with a `seen` set finds duplicates in O(n); sort the result before printing.",
          ],
          cases: [
            { stdin: "3 1 3 5 1\n", expected: "distinct: 3\nordered: 3 1 5\ndups: 1 3\nmissing: 2 4\n" },
            { stdin: "1 2 3\n", expected: "distinct: 3\nordered: 1 2 3\ndups: (none)\nmissing: (none)\n", hidden: true },
            { stdin: "7 7 7\n", expected: "distinct: 1\nordered: 7\ndups: 7\nmissing: 1 2 3 4 5 6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `{}`?",
          options: ["An empty set", "An empty dict", "An empty list", "A syntax error"],
          answer: 1,
          explanation: "Braces alone make a dict; the empty set is `set()`.",
        },
        {
          prompt: "Why does `{[1, 2], 3}` fail?",
          options: ["Sets cannot mix types", "A list is unhashable and cannot be a set element", "Sets need at least three elements", "Lists must be converted with `list()` first"],
          answer: 1,
          explanation: "Set elements must be hashable; use a tuple `(1, 2)` or a `frozenset`.",
        },
        {
          prompt: "What is wrong with `print(set(words))` in a judged program?",
          options: ["Nothing", "Set iteration order is arbitrary and randomised for strings, so the output differs between runs — print `sorted(...)`", "It prints the class name", "It raises `TypeError`"],
          answer: 1,
          explanation: "String hashes are salted per process; the printed order is not reproducible. Sort first.",
        },
        {
          prompt: "Which removes `x` from a set without raising when `x` is absent?",
          options: ["`s.remove(x)`", "`s.discard(x)`", "`s.pop(x)`", "`del s[x]`"],
          answer: 1,
          explanation: "`remove` raises `KeyError`, `pop` takes no argument and `del` does not apply to sets.",
        },
        {
          prompt: "Which expression deduplicates `xs` while keeping first-seen order?",
          options: ["`list(set(xs))`", "`list(dict.fromkeys(xs))`", "`sorted(set(xs))`", "`set(xs)`"],
          answer: 1,
          explanation: "Dict keys are unique and ordered by insertion. `set` loses order; `sorted` imposes a different order.",
        },
      ],
    },
    {
      slug: "hashing-and-keys",
      file: "04-hashing-and-keys.md",
      exercises: [
        {
          title: "Points as keys",
          prompt: `Read \`n\` points \`x y\` (some repeated) and count how often each occurs using a dictionary keyed by the tuple \`(x, y)\` — written in subscript form as \`counts[x, y]\`. Print each distinct point with its count, ordered by \`x\` then \`y\`, then how many distinct points lie on the diagonal \`x == y\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`(x, y): count\` per distinct point, then \`diagonal: <n>\`.

\`\`\`text
4
1 2
0 0
1 2
3 3
\`\`\`
prints
\`\`\`text
(0, 0): 1
(1, 2): 2
(3, 3): 1
diagonal: 2
\`\`\``,
          starter: String.raw`n = int(input())
counts = {}
for _ in range(n):
    x, y = map(int, input().split())
    # TODO: counts[x, y] ...
# TODO: print sorted, then the diagonal count
`,
          solution: String.raw`n = int(input())
counts = {}
for _ in range(n):
    x, y = map(int, input().split())
    counts[x, y] = counts.get((x, y), 0) + 1
for (x, y), c in sorted(counts.items()):
    print(f"({x}, {y}): {c}")
print(f"diagonal: {sum(1 for x, y in counts if x == y)}")
`,
          hints: [
            "`counts[x, y]` is `counts[(x, y)]` — the comma builds the tuple key.",
            "`sorted(counts.items())` orders by the tuple key, which compares `x` first then `y`.",
          ],
          cases: [
            { stdin: "4\n1 2\n0 0\n1 2\n3 3\n", expected: "(0, 0): 1\n(1, 2): 2\n(3, 3): 1\ndiagonal: 2\n" },
            { stdin: "1\n-1 -1\n", expected: "(-1, -1): 1\ndiagonal: 1\n", hidden: true },
            { stdin: "3\n2 1\n1 2\n2 1\n", expected: "(1, 2): 1\n(2, 1): 2\ndiagonal: 0\n", hidden: true },
          ],
        },
        {
          title: "A hashable version",
          prompt: `Implement \`Version\` holding \`major\` and \`minor\` parsed from text like \`1.2\`. Define \`__eq__\` (by value, returning \`NotImplemented\` for other types) **and** \`__hash__\` (over the same fields) so that instances work as set members and dict keys. Read \`n\` versions; print the number of distinct versions, whether the first two are equal, and the distinct versions sorted (define \`__lt__\` too) as \`major.minor\`.

**Input:** \`n\`, then \`n\` version strings (\`n >= 2\`).
**Output:** \`distinct <k>\`, \`first two equal <True/False>\`, \`sorted <versions>\`.

\`\`\`text
4
1.2
1.10
1.2
0.9
\`\`\`
prints
\`\`\`text
distinct 3
first two equal False
sorted 0.9 1.2 1.10
\`\`\``,
          starter: String.raw`class Version:
    def __init__(self, text):
        major, minor = text.split(".")
        self.major, self.minor = int(major), int(minor)

    # TODO: __eq__, __hash__, __lt__

    def __str__(self):
        return f"{self.major}.{self.minor}"


n = int(input())
versions = [Version(input().strip()) for _ in range(n)]
print(f"distinct {len(set(versions))}")
print(f"first two equal {versions[0] == versions[1]}")
print("sorted", " ".join(str(v) for v in sorted(set(versions))))
`,
          solution: String.raw`class Version:
    def __init__(self, text):
        major, minor = text.split(".")
        self.major, self.minor = int(major), int(minor)

    def _key(self):
        return (self.major, self.minor)

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._key() == other._key()

    def __hash__(self):
        return hash(self._key())

    def __lt__(self, other):
        return self._key() < other._key()

    def __str__(self):
        return f"{self.major}.{self.minor}"


n = int(input())
versions = [Version(input().strip()) for _ in range(n)]
print(f"distinct {len(set(versions))}")
print(f"first two equal {versions[0] == versions[1]}")
print("sorted", " ".join(str(v) for v in sorted(set(versions))))
`,
          hints: [
            "Hash and compare the same tuple of fields — a `_key()` helper keeps them in step.",
            "Defining `__eq__` alone makes the class unhashable; `__hash__` must be defined too for `set(versions)` to work.",
          ],
          cases: [
            { stdin: "4\n1.2\n1.10\n1.2\n0.9\n", expected: "distinct 3\nfirst two equal False\nsorted 0.9 1.2 1.10\n" },
            { stdin: "2\n3.0\n3.0\n", expected: "distinct 1\nfirst two equal True\nsorted 3.0\n", hidden: true },
            { stdin: "3\n2.1\n10.0\n2.1\n", expected: "distinct 2\nfirst two equal False\nsorted 2.1 10.0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A class defines `__eq__` but not `__hash__`. What happens to `{obj}`?",
          options: ["Works, hashing by identity", "`TypeError: unhashable type` — defining `__eq__` sets `__hash__` to `None`", "Works, hashing by `__eq__`", "Works only for frozen instances"],
          answer: 1,
          explanation: "Value equality with identity hashing would break the contract, so Python removes the default hash. Define `__hash__` over the compared fields.",
        },
        {
          prompt: "Which rule must `__hash__` and `__eq__` obey together?",
          options: ["Unequal objects must have different hashes", "Equal objects must have equal hashes", "Hashes must be positive", "`__hash__` must return the object's `id`"],
          answer: 1,
          explanation: "Lookups find candidates by hash and confirm by equality, so equal keys must land in the same slot. Collisions between unequal keys are allowed.",
        },
        {
          prompt: "How many keys does `{1: \"a\", 1.0: \"b\", True: \"c\"}` have?",
          options: ["3", "1", "2", "It raises `TypeError`"],
          answer: 1,
          explanation: "`1 == 1.0 == True` and they hash equally, so each assignment overwrites the same key; the value is `\"c\"`.",
        },
        {
          prompt: "Why is `hash(\"abc\")` different between two runs of the same program?",
          options: ["Strings are mutable", "CPython salts string hashing with a random seed per process, to defeat collision attacks", "It is a bug", "It is not — it is always the same"],
          answer: 1,
          explanation: "Hash randomisation is on by default; it is why set order for strings varies and why hashes must never be printed or persisted.",
        },
        {
          prompt: "Which is a valid dictionary key?",
          options: ["`[1, 2]`", "`{1, 2}`", "`(1, [2])`", "`(1, frozenset({2}))`"],
          answer: 3,
          explanation: "A tuple is hashable only if all its elements are; lists and sets are not, frozensets are.",
        },
      ],
    },
    {
      slug: "nested-data-and-json",
      file: "05-nested-data-and-json.md",
      exercises: [
        {
          title: "Walk the document",
          prompt: `Read one JSON document from standard input with \`json.load(sys.stdin)\` and print every leaf value with its path, using a recursive walk: object keys join with \`.\`, array indexes appear as \`[i]\`. Print booleans and \`null\` the Python way (\`True\`, \`None\`). Finish with the number of leaves.

**Input:** a JSON document.
**Output:** \`<path> = <value>\` per leaf in document order, then \`leaves: <n>\`.

\`\`\`text
{"name": "ada", "langs": ["python", "c"], "active": true, "boss": null}
\`\`\`
prints
\`\`\`text
name = ada
langs[0] = python
langs[1] = c
active = True
boss = None
leaves: 5
\`\`\``,
          starter: String.raw`import json
import sys


def walk(node, path=""):
    # TODO: yield (path, leaf) pairs recursively
    yield path, node


doc = json.load(sys.stdin)
count = 0
for path, leaf in walk(doc):
    print(f"{path} = {leaf}")
    count += 1
print(f"leaves: {count}")
`,
          solution: String.raw`import json
import sys


def walk(node, path=""):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from walk(value, f"{path}.{key}" if path else key)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            yield from walk(value, f"{path}[{i}]")
    else:
        yield path, node


doc = json.load(sys.stdin)
count = 0
for path, leaf in walk(doc):
    print(f"{path} = {leaf}")
    count += 1
print(f"leaves: {count}")
`,
          hints: [
            "Dispatch on `isinstance(node, dict)` / `list`; anything else is a leaf.",
            "`yield from walk(...)` flattens the recursive generator into one stream.",
          ],
          cases: [
            { stdin: "{\"name\": \"ada\", \"langs\": [\"python\", \"c\"], \"active\": true, \"boss\": null}\n", expected: "name = ada\nlangs[0] = python\nlangs[1] = c\nactive = True\nboss = None\nleaves: 5\n" },
            { stdin: "[1, [2, {\"k\": 3.5}], []]\n", expected: "[0] = 1\n[1][0] = 2\n[1][1].k = 3.5\nleaves: 3\n", hidden: true },
            { stdin: "42\n", expected: " = 42\nleaves: 1\n", hidden: true },
            { stdin: "{\"a\": {\"b\": {\"c\": \"deep\"}}, \"d\": []}\n", expected: "a.b.c = deep\nleaves: 1\n", hidden: true },
          ],
        },
        {
          title: "Canonical JSON",
          prompt: `Read a JSON document and print it in canonical form — \`json.dumps\` with sorted keys and compact separators — then the number of top-level keys (\`0\` if the document is not an object) and the maximum nesting depth, where a scalar has depth 0 and each enclosing object or array adds 1.

**Input:** a JSON document.
**Output:** the canonical text, then \`keys: <n>\`, then \`depth: <d>\`.

\`\`\`text
{"b": [1, {"z": null, "a": 2}], "a": "x"}
\`\`\`
prints
\`\`\`text
{"a":"x","b":[1,{"a":2,"z":null}]}
keys: 2
depth: 3
\`\`\``,
          starter: String.raw`import json
import sys


def depth(node):
    # TODO: 0 for a scalar; 1 + max child depth otherwise (an empty container is 1)
    return 0


doc = json.load(sys.stdin)
# TODO: print canonical text, key count, depth
`,
          solution: String.raw`import json
import sys


def depth(node):
    if isinstance(node, dict):
        return 1 + max((depth(v) for v in node.values()), default=0)
    if isinstance(node, list):
        return 1 + max((depth(v) for v in node), default=0)
    return 0


doc = json.load(sys.stdin)
print(json.dumps(doc, sort_keys=True, separators=(",", ":")))
print(f"keys: {len(doc) if isinstance(doc, dict) else 0}")
print(f"depth: {depth(doc)}")
`,
          hints: [
            "`separators=(\",\", \":\")` removes the spaces; `sort_keys=True` orders every object's keys, at every level.",
            "`max(..., default=0)` handles an empty object or array.",
          ],
          cases: [
            { stdin: "{\"b\": [1, {\"z\": null, \"a\": 2}], \"a\": \"x\"}\n", expected: "{\"a\":\"x\",\"b\":[1,{\"a\":2,\"z\":null}]}\nkeys: 2\ndepth: 3\n" },
            { stdin: "[]\n", expected: "[]\nkeys: 0\ndepth: 1\n", hidden: true },
            { stdin: "\"just a string\"\n", expected: "\"just a string\"\nkeys: 0\ndepth: 0\n", hidden: true },
            { stdin: "{\"k\": {}, \"j\": [[[]]]}\n", expected: "{\"j\":[[[]]],\"k\":{}}\nkeys: 2\ndepth: 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `json.loads('{\"a\": [1, null, true]}')` return?",
          options: ["`{'a': [1, None, True]}`", "`{'a': [1, 'null', 'true']}`", "`{'a': (1, None, True)}`", "`JSONDecodeError`"],
          answer: 0,
          explanation: "JSON arrays become lists, `null` becomes `None`, `true` becomes `True`.",
        },
        {
          prompt: "What does `json.loads(json.dumps({1: (2, 3)}))` return?",
          options: ["`{1: (2, 3)}`", "`{'1': [2, 3]}`", "`{1: [2, 3]}`", "`TypeError`"],
          answer: 1,
          explanation: "JSON keys are always strings, and arrays come back as lists — two things the round trip does not preserve.",
        },
        {
          prompt: "Which `dumps` option makes equal dicts built in different orders produce identical text?",
          options: ["`indent=2`", "`sort_keys=True`", "`ensure_ascii=False`", "`separators=(\",\", \":\")`"],
          answer: 1,
          explanation: "Sorting the keys removes insertion order from the output; the other options only change formatting.",
        },
        {
          prompt: "What is the safe way to read `doc[\"a\"][\"b\"]` when either key may be missing?",
          options: ["`doc[\"a\"][\"b\"] or None`", "`doc.get(\"a\", {}).get(\"b\")`", "`doc.get(\"a\").get(\"b\")`", "`doc[\"a\", \"b\"]`"],
          answer: 1,
          explanation: "The first `get` must supply an empty dict as the default so the second `get` has something to call; `doc.get(\"a\").get(\"b\")` fails with `AttributeError` on `None`.",
        },
        {
          prompt: "Which of these is invalid JSON?",
          options: ["`{\"a\": 1}`", "`[1, 2, 3]`", "`{'a': 1}`", "`\"text\"`"],
          answer: 2,
          explanation: "JSON strings and keys use double quotes only; single quotes, trailing commas and comments are all rejected by `json.loads`.",
        },
      ],
    },
    {
      slug: "choosing-a-collection",
      file: "06-choosing-a-collection.md",
      exercises: [
        {
          title: "Priority queue",
          prompt: `Implement a priority queue on \`heapq\` from commands: \`push p task\` adds a task with integer priority \`p\` (smaller is more urgent); \`pop\` removes and prints the most urgent task — on equal priorities the one pushed **first** — or \`empty\`; \`peek\` prints it without removing (or \`empty\`). Store \`(priority, sequence, task)\` tuples so ties never compare the task text.

**Input:** commands.
**Output:** one line per \`pop\` and \`peek\`.

\`\`\`text
push 2 write
push 1 read
push 2 test
pop
pop
peek
pop
pop
\`\`\`
prints
\`\`\`text
read
write
test
test
empty
\`\`\``,
          starter: String.raw`import heapq
import sys

heap = []
seq = 0
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: push / pop / peek
`,
          solution: String.raw`import heapq
import sys

heap = []
seq = 0
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "push":
        heapq.heappush(heap, (int(args[0]), seq, " ".join(args[1:])))
        seq += 1
    elif cmd == "pop":
        print(heapq.heappop(heap)[2] if heap else "empty")
    elif cmd == "peek":
        print(heap[0][2] if heap else "empty")
`,
          hints: [
            "A rising sequence number as the second tuple element makes earlier pushes win ties.",
            "`heap[0]` is the minimum; `heappop` removes it in O(log n).",
          ],
          cases: [
            { stdin: "push 2 write\npush 1 read\npush 2 test\npop\npop\npeek\npop\npop\n", expected: "read\nwrite\ntest\ntest\nempty\n" },
            { stdin: "peek\npush 5 only one\npeek\npop\n", expected: "empty\nonly one\nonly one\n", hidden: true },
            { stdin: "push 3 c\npush 3 b\npush 3 a\npop\npop\npop\n", expected: "c\nb\na\n", hidden: true },
          ],
        },
        {
          title: "Top and bottom k",
          prompt: `Read \`k\` and a line of words. Print the \`k\` longest words with \`heapq.nlargest\` and the \`k\` shortest with \`heapq.nsmallest\`, both using \`key=len\` — and, because the heap functions keep first-seen order on ties, print exactly what they return. Then print the \`k\` largest numbers from a third line of integers, descending.

**Input:** \`k\`, a line of words, a line of integers.
**Output:** \`longest: <words>\`, \`shortest: <words>\`, \`largest: <numbers>\`.

\`\`\`text
2
fig banana kiwi apple
5 1 9 3
\`\`\`
prints
\`\`\`text
longest: banana apple
shortest: fig kiwi
largest: 9 5
\`\`\``,
          starter: String.raw`import heapq

k = int(input())
words = input().split()
nums = list(map(int, input().split()))
# TODO: nlargest / nsmallest with key=len; nlargest on the numbers
`,
          solution: String.raw`import heapq

k = int(input())
words = input().split()
nums = list(map(int, input().split()))
print("longest:", " ".join(heapq.nlargest(k, words, key=len)))
print("shortest:", " ".join(heapq.nsmallest(k, words, key=len)))
print("largest:", " ".join(map(str, heapq.nlargest(k, nums))))
`,
          hints: [
            "`nlargest(k, iterable, key=...)` returns a list sorted from largest down; `nsmallest` from smallest up.",
            "Both accept `k` larger than the input and just return everything.",
          ],
          cases: [
            { stdin: "2\nfig banana kiwi apple\n5 1 9 3\n", expected: "longest: banana apple\nshortest: fig kiwi\nlargest: 9 5\n" },
            { stdin: "3\na bb\n1\n", expected: "longest: bb a\nshortest: a bb\nlargest: 1\n", hidden: true },
            { stdin: "1\nzz yy xx\n-1 -5 -3\n", expected: "longest: zz\nshortest: zz\nlargest: -1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which structure answers `x in c` in O(1)?",
          options: ["`list`", "`tuple`", "`set`", "`deque`"],
          answer: 2,
          explanation: "Sets and dicts hash; the sequence types scan.",
        },
        {
          prompt: "What is `h[0]` after `heapq.heapify(h)` on `[5, 1, 3]`?",
          options: ["`5`", "`1`", "`3`", "Undefined"],
          answer: 1,
          explanation: "A heap keeps its minimum at index 0. The rest of the list is *not* sorted — only the heap property holds.",
        },
        {
          prompt: "How do you get a max-heap from `heapq`?",
          options: ["`heapq.heapify(h, reverse=True)`", "Push negated values, or tuples with a negated priority", "`heapq.maxheap(h)`", "Sort the list descending first"],
          answer: 1,
          explanation: "`heapq` is min-only; negation flips the order. Tuples `(-priority, count, item)` build a max-priority queue with stable ties.",
        },
        {
          prompt: "Why is a counter inserted as the second element of heap tuples `(priority, count, task)`?",
          options: ["To make pops faster", "So equal priorities never fall through to comparing `task`, which may be incomparable, and earlier entries win", "Because heaps require three-tuples", "To store the heap size"],
          answer: 1,
          explanation: "Tuples compare element by element; the unique rising counter settles ties deterministically before the third element is ever compared.",
        },
        {
          prompt: "Which is the O(n) mistake?",
          options: ["`deque.popleft()`", "`list.pop()`", "`list.pop(0)`", "`dict.pop(key)`"],
          answer: 2,
          explanation: "Removing the first element of a list shifts every other element; the other operations are constant time.",
        },
      ],
    },
    {
      slug: "collections-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Word-frequency report",
          prompt: `Read text until the end of input. Words are whitespace tokens, case-folded, with leading and trailing punctuation stripped; empty results are ignored. Print the five most frequent words as \`<word> <count>\` with ties broken alphabetically, then \`distinct: <n>\` and \`hapax: <n>\` (words occurring once).

**Input:** any text.
**Output:** up to five lines, then two summary lines.

\`\`\`text
It was the best of times, it was the worst of times.
\`\`\`
prints
\`\`\`text
it 2
of 2
the 2
times 2
was 2
distinct: 7
hapax: 2
\`\`\``,
          starter: String.raw`import string
import sys
from collections import Counter

counts = Counter()
for line in sys.stdin:
    # TODO
    pass
# TODO
`,
          solution: String.raw`import string
import sys
from collections import Counter

counts = Counter()
for line in sys.stdin:
    for tok in line.split():
        word = tok.casefold().strip(string.punctuation)
        if word:
            counts[word] += 1
for word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:5]:
    print(word, n)
print(f"distinct: {len(counts)}")
print(f"hapax: {sum(1 for n in counts.values() if n == 1)}")
`,
          hints: [
            "`counts[word] += 1` works on a Counter without any check.",
            "Sort by `(-count, word)` and slice the first five.",
          ],
          cases: [
            { stdin: "It was the best of times, it was the worst of times.\n", expected: "it 2\nof 2\nthe 2\ntimes 2\nwas 2\ndistinct: 7\nhapax: 2\n" },
            { stdin: "", expected: "distinct: 0\nhapax: 0\n", hidden: true },
            { stdin: "a a a b b c\n", expected: "a 3\nb 2\nc 1\ndistinct: 3\nhapax: 1\n", hidden: true },
          ],
        },
        {
          title: "Snapshot diff",
          prompt: `Two snapshots of a key–value store arrive as \`key=value\` lines, separated by a line \`--\`. Using set operations on the dictionaries' keys, print the keys only in the second snapshot, the keys only in the first, and the keys in both whose values differ — each sorted and space-separated, or \`(none)\`.

**Input:** lines, \`--\`, lines.
**Output:** \`added: …\`, \`removed: …\`, \`changed: …\`.

\`\`\`text
a=1
b=2
c=3
--
b=2
c=4
d=5
\`\`\`
prints
\`\`\`text
added: d
removed: a
changed: c
\`\`\``,
          starter: String.raw`import sys

before, after = {}, {}
current = before
for line in sys.stdin:
    line = line.strip()
    if line == "--":
        current = after
        continue
    if line:
        key, _, value = line.partition("=")
        current[key] = value


def show(label, keys):
    print(f"{label}: {' '.join(sorted(keys)) if keys else '(none)'}")


# TODO: added, removed, changed
`,
          solution: String.raw`import sys

before, after = {}, {}
current = before
for line in sys.stdin:
    line = line.strip()
    if line == "--":
        current = after
        continue
    if line:
        key, _, value = line.partition("=")
        current[key] = value


def show(label, keys):
    print(f"{label}: {' '.join(sorted(keys)) if keys else '(none)'}")


show("added", after.keys() - before.keys())
show("removed", before.keys() - after.keys())
show("changed", {k for k in before.keys() & after.keys() if before[k] != after[k]})
`,
          hints: [
            "Dict key views support `-` and `&` directly.",
            "The changed keys are the intersection filtered by a value comparison.",
          ],
          cases: [
            { stdin: "a=1\nb=2\nc=3\n--\nb=2\nc=4\nd=5\n", expected: "added: d\nremoved: a\nchanged: c\n" },
            { stdin: "--\n", expected: "added: (none)\nremoved: (none)\nchanged: (none)\n", hidden: true },
            { stdin: "x=1\n--\nx=1\n", expected: "added: (none)\nremoved: (none)\nchanged: (none)\n", hidden: true },
            { stdin: "x=1\ny=2\n--\n", expected: "added: (none)\nremoved: x y\nchanged: (none)\n", hidden: true },
          ],
        },
        {
          title: "Scheduler",
          prompt: `Jobs arrive as \`add priority name\` (lower number runs first; equal priorities run in arrival order) and \`run\` executes the next job, printing \`run <name>\` — or \`idle\` when nothing is pending. Use a heap of \`(priority, arrival, name)\` tuples. After the input ends print \`pending <n>\`.

**Input:** commands.
**Output:** one line per \`run\`, then the pending count.

\`\`\`text
add 2 backup
add 1 deploy
run
add 1 alert
run
run
run
\`\`\`
prints
\`\`\`text
run deploy
run alert
run backup
idle
pending 0
\`\`\``,
          starter: String.raw`import heapq
import sys

heap = []
arrival = 0
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
print(f"pending {len(heap)}")
`,
          solution: String.raw`import heapq
import sys

heap = []
arrival = 0
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "add":
        heapq.heappush(heap, (int(args[0]), arrival, args[1]))
        arrival += 1
    elif cmd == "run":
        if heap:
            _, _, name = heapq.heappop(heap)
            print(f"run {name}")
        else:
            print("idle")
print(f"pending {len(heap)}")
`,
          hints: [
            "The arrival counter is the tie-breaker; it must increase on every add.",
            "`len(heap)` is the number of jobs still waiting.",
          ],
          cases: [
            { stdin: "add 2 backup\nadd 1 deploy\nrun\nadd 1 alert\nrun\nrun\nrun\n", expected: "run deploy\nrun alert\nrun backup\nidle\npending 0\n" },
            { stdin: "run\nadd 5 a\nadd 5 b\n", expected: "idle\npending 2\n", hidden: true },
            { stdin: "add 3 x\nadd 3 y\nadd 3 z\nrun\nrun\n", expected: "run x\nrun y\npending 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `d.get(\"k\", 0)` return when `d[\"k\"]` is `None`?",
          options: ["`0`", "`None`", "`KeyError`", "`False`"],
          answer: 1,
          explanation: "The default applies only when the key is *absent*. A stored `None` is a present value and is returned as is.",
        },
        {
          prompt: "What is `Counter(\"abca\").most_common(1)`?",
          options: ["`[('a', 2)]`", "`('a', 2)`", "`['a']`", "`{'a': 2}`"],
          answer: 0,
          explanation: "`most_common` returns a list of `(element, count)` pairs, even for `n=1`.",
        },
        {
          prompt: "After `g = defaultdict(list); g[\"a\"].append(1)`, what is `dict(g)`?",
          options: ["`{}`", "`{'a': [1]}`", "`{'a': 1}`", "`defaultdict(...)`"],
          answer: 1,
          explanation: "The first access created the list and stored it; `dict()` gives a plain copy for display.",
        },
        {
          prompt: "What is `{1, 2, 3} - {2} | {4}`?",
          options: ["`{1, 3, 4}`", "`{1, 3}`", "`{4}`", "`TypeError`"],
          answer: 0,
          explanation: "`-` binds tighter than `|`, so the difference `{1, 3}` is computed first and then unioned with `{4}`.",
        },
        {
          prompt: "Which object can be a set element?",
          options: ["`[1]`", "`{1}`", "`{1: 2}`", "`(1, 2)`"],
          answer: 3,
          explanation: "Only hashable objects: a tuple of hashables qualifies; lists, sets and dicts do not.",
        },
        {
          prompt: "Two `Point` instances compare equal by `__eq__` but have no `__hash__`. What does `len({p1, p2})` do?",
          options: ["Returns `1`", "Returns `2`", "Raises `TypeError: unhashable type`", "Returns `0`"],
          answer: 2,
          explanation: "Defining `__eq__` disables the inherited hash; instances cannot enter a set until `__hash__` is defined.",
        },
        {
          prompt: "What does `json.dumps({\"b\": 1, \"a\": 2}, sort_keys=True)` produce?",
          options: ["`'{\"b\": 1, \"a\": 2}'`", "`'{\"a\": 2, \"b\": 1}'`", "`'{a: 2, b: 1}'`", "`\"{'a': 2, 'b': 1}\"`"],
          answer: 1,
          explanation: "Keys are sorted, and JSON uses double-quoted keys with `: ` and `, ` separators by default.",
        },
        {
          prompt: "What does `json.loads('[1, 2, 3]')` return?",
          options: ["`(1, 2, 3)`", "`[1, 2, 3]`", "`'[1, 2, 3]'`", "`{1, 2, 3}`"],
          answer: 1,
          explanation: "JSON arrays map to Python lists.",
        },
        {
          prompt: "Which operation on a `heapq` heap is O(log n)?",
          options: ["Reading `h[0]`", "`heapq.heappush`", "`heapq.heapify`", "`len(h)`"],
          answer: 1,
          explanation: "Push and pop are logarithmic; peeking the minimum and `len` are constant; `heapify` of a whole list is O(n).",
        },
        {
          prompt: "What is the right structure for 'is this element one I have seen before?' inside a loop over a million items?",
          options: ["A list with `in`", "A set with `in`", "A sorted list with `bisect`", "A tuple"],
          answer: 1,
          explanation: "Set membership is O(1); a list scan would make the loop quadratic; `bisect` needs the collection sorted and inserts are O(n).",
        },
        {
          prompt: "What does `d.pop(\"k\")` do when `\"k\"` is absent?",
          options: ["Returns `None`", "Raises `KeyError`", "Returns `False`", "Inserts `None`"],
          answer: 1,
          explanation: "Without a default argument `pop` raises; `d.pop(\"k\", None)` returns the default instead.",
        },
        {
          prompt: "Why sort a set before joining it into output?",
          options: ["`join` requires sorted input", "Set iteration order is unspecified and, for strings, randomised per process", "Sorting removes duplicates", "It is faster"],
          answer: 1,
          explanation: "Only a sorted list gives a reproducible order; the judge compares text exactly.",
        },
      ],
    },
  ],
});
