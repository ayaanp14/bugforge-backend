import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "iterators-and-generators",
  title: "Iterators, generators and itertools",
  blurb: "The iteration protocol with iter, next and StopIteration, generators with yield and yield from, generator expressions and the short-circuit consumers, the itertools toolkit, functools and operator, and lazy pipelines of generator stages.",
  icon: "lambda",
  overview: `Every loop, comprehension and aggregate in Python runs on one protocol — \`iter()\`, then \`next()\` until \`StopIteration\` — and generators are the way that protocol is written in practice: a function with \`yield\` whose locals are its state. Once that is clear, laziness stops being a curiosity and becomes the default design: values are produced on demand, infinite sequences are ordinary, a million records cost the memory of one, and a chain of small stages processes a stream in a single pass. This module builds that understanding from the protocol up and ends with a real pipeline.

The iteration protocol defines iterable and iterator, desugars \`for\`, and writes an iterator class by hand. Generators covers \`yield\`, suspension, infinite generators bounded by \`islice\`, \`yield from\`, and \`send\`/\`close\` in outline. Generator expressions covers the lazy comprehension and the short-circuit consumers \`any\`, \`all\` and \`next\`. itertools catalogues the toolkit, with \`groupby\`'s consecutive-run rule and the combinatoric generators. functools and operator covers \`cache\`, \`partial\`, \`reduce\`, \`wraps\`, \`singledispatch\` and the operator factories. Lazy pipelines assembles the parts into a log processor with one job per stage.

The exercises are whole programs: a hand-written range iterator that shows one-shot exhaustion, a sentinel reader with \`iter(callable, sentinel)\`, an infinite Fibonacci generator sliced three ways, a tree walk with \`yield from\`, short-circuit drills, a trace that shows lazy versus eager evaluation, run-length encoding with \`groupby\`, combinatoric counts, cache statistics, a \`singledispatch\` describer, a purchase pipeline and a sliding-window stream. The checkpoint adds a run-length codec, a subset-sum search over \`combinations\` that stops at the first hit, and a log pipeline of generator stages.`,
  lessons: [
    {
      slug: "the-iteration-protocol",
      file: "01-the-iteration-protocol.md",
      exercises: [
        {
          title: "A range of your own",
          prompt: `Implement \`Span(start, stop, step)\` as an **iterator class** with \`__iter__\` returning \`self\` and \`__next__\` producing \`start, start + step, …\` while below \`stop\` (\`step\` is positive), then raising \`StopIteration\`. Read \`start stop step\`, print the values from a first pass, then try a second pass over the **same object** and print \`exhausted\` if it yields nothing. Finally print the values from \`Span(...)\` consumed with \`next\` and a default, three times.

**Input:** \`start stop step\`.
**Output:** \`first: <values>\` (or \`first: (empty)\`), \`second: <values>\` or \`second: exhausted\`, then three lines from \`next(it, "done")\`.

\`\`\`text
1 8 3
\`\`\`
prints
\`\`\`text
first: 1 4 7
second: exhausted
1
4
7
\`\`\``,
          starter: String.raw`class Span:
    def __init__(self, start, stop, step):
        self.current = start
        self.stop = stop
        self.step = step

    # TODO: __iter__ and __next__


start, stop, step = map(int, input().split())
span = Span(start, stop, step)
first = list(span)
print("first:", " ".join(map(str, first)) if first else "(empty)")
second = list(span)
print("second:", " ".join(map(str, second)) if second else "exhausted")
it = Span(start, stop, step)
for _ in range(3):
    print(next(it, "done"))
`,
          solution: String.raw`class Span:
    def __init__(self, start, stop, step):
        self.current = start
        self.stop = stop
        self.step = step

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.stop:
            raise StopIteration
        value = self.current
        self.current += self.step
        return value


start, stop, step = map(int, input().split())
span = Span(start, stop, step)
first = list(span)
print("first:", " ".join(map(str, first)) if first else "(empty)")
second = list(span)
print("second:", " ".join(map(str, second)) if second else "exhausted")
it = Span(start, stop, step)
for _ in range(3):
    print(next(it, "done"))
`,
          hints: [
            "An iterator's `__iter__` returns itself; the state that advances lives in the instance.",
            "Once `__next__` has raised `StopIteration`, it must keep raising it — the second `list()` is empty.",
          ],
          cases: [
            { stdin: "1 8 3\n", expected: "first: 1 4 7\nsecond: exhausted\n1\n4\n7\n" },
            { stdin: "0 2 1\n", expected: "first: 0 1\nsecond: exhausted\n0\n1\ndone\n", hidden: true },
            { stdin: "5 5 1\n", expected: "first: (empty)\nsecond: exhausted\ndone\ndone\ndone\n", hidden: true },
          ],
        },
        {
          title: "Until the sentinel",
          prompt: `Use the two-argument form \`iter(input, "END")\` to read integer lines until a line equal to \`END\`, and print their sum and count. Then read the rest of the input with a plain \`for line in sys.stdin\` loop and print how many lines follow the sentinel.

**Input:** integer lines, \`END\`, then any further lines.
**Output:** \`sum <s> count <n>\`, then \`after <k>\`.

\`\`\`text
3
4
END
x
y
\`\`\`
prints
\`\`\`text
sum 7 count 2
after 2
\`\`\``,
          starter: String.raw`import sys

total = count = 0
# TODO: for line in iter(input, "END"): ...
print(f"sum {total} count {count}")
after = sum(1 for _ in sys.stdin)
print(f"after {after}")
`,
          solution: String.raw`import sys

total = count = 0
for line in iter(input, "END"):
    total += int(line)
    count += 1
print(f"sum {total} count {count}")
after = sum(1 for _ in sys.stdin)
print(f"after {after}")
`,
          hints: [
            "`iter(input, \"END\")` calls `input()` repeatedly and stops when it returns the sentinel — no `while True`/`break` needed.",
            "Counting an iterator is `sum(1 for _ in it)`; there is no `len` on a file.",
          ],
          cases: [
            { stdin: "3\n4\nEND\nx\ny\n", expected: "sum 7 count 2\nafter 2\n" },
            { stdin: "END\n", expected: "sum 0 count 0\nafter 0\n", hidden: true },
            { stdin: "-1\n-2\n-3\nEND\n", expected: "sum -6 count 3\nafter 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement is correct?",
          options: ["A list is an iterator", "A list is an iterable; `iter(list)` returns a fresh iterator each time", "`next(list)` returns the first element", "An iterator can be rewound with `reset()`"],
          answer: 1,
          explanation: "Containers are iterables; the iterator is a separate one-shot object. `next` on a list is a `TypeError`.",
        },
        {
          prompt: "What does `for x in xs:` call?",
          options: ["`xs.__next__()` repeatedly", "`iter(xs)` once, then `next()` on the result until `StopIteration`", "`xs.__getitem__` only", "`len(xs)` then indexing"],
          answer: 1,
          explanation: "That desugaring is the whole protocol; every consumer does the same.",
        },
        {
          prompt: "After `p = zip(a, b); list(p)`, what is `list(p)`?",
          options: ["The same pairs again", "`[]` — `zip` returns a one-shot iterator", "`TypeError`", "`None`"],
          answer: 1,
          explanation: "`zip`, `map`, `filter`, `enumerate` and generators are exhausted after one pass; materialise if you need two.",
        },
        {
          prompt: "What must `__next__` do when there are no more values?",
          options: ["Return `None`", "Raise `StopIteration`", "Return `False`", "Raise `IndexError`"],
          answer: 1,
          explanation: "`StopIteration` is the signal the protocol defines; returning `None` would make `None` a value.",
        },
        {
          prompt: "What does `iter(f.readline, \"\")` do?",
          options: ["Reads the whole file at once", "Calls `f.readline()` repeatedly until it returns the empty string", "Raises `TypeError`", "Reads one line"],
          answer: 1,
          explanation: "The two-argument form loops a callable until the sentinel value appears — here, end of file.",
        },
      ],
    },
    {
      slug: "generators",
      file: "02-generators.md",
      exercises: [
        {
          title: "Fibonacci, sliced three ways",
          prompt: `Write an infinite generator \`fib()\` yielding \`0, 1, 1, 2, …\`. Read \`n\` and \`limit\` and print: the first \`n\` values (\`itertools.islice\`); the values below \`limit\` (\`itertools.takewhile\`); and the first value greater than \`limit\` (\`next\` over a filtered generator expression). Each call to \`fib()\` starts fresh.

**Input:** \`n limit\`.
**Output:** \`first: …\`, \`below: …\`, \`next: <value>\`.

\`\`\`text
8 20
\`\`\`
prints
\`\`\`text
first: 0 1 1 2 3 5 8 13
below: 0 1 1 2 3 5 8 13
next: 21
\`\`\``,
          starter: String.raw`from itertools import islice, takewhile


def fib():
    # TODO: infinite generator
    yield 0


n, limit = map(int, input().split())
# TODO: three lines
`,
          solution: String.raw`from itertools import islice, takewhile


def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


n, limit = map(int, input().split())
print("first:", " ".join(map(str, islice(fib(), n))))
print("below:", " ".join(map(str, takewhile(lambda x: x < limit, fib()))))
print("next:", next(x for x in fib() if x > limit))
`,
          hints: [
            "`while True` with a `yield` inside is the shape of an infinite generator; consumers decide when to stop.",
            "Never `list(fib())`; bound it with `islice`, `takewhile` or `next`.",
          ],
          cases: [
            { stdin: "8 20\n", expected: "first: 0 1 1 2 3 5 8 13\nbelow: 0 1 1 2 3 5 8 13\nnext: 21\n" },
            { stdin: "1 0\n", expected: "first: 0\nbelow:\nnext: 1\n", hidden: true },
            { stdin: "3 100\n", expected: "first: 0 1 1\nbelow: 0 1 1 2 3 5 8 13 21 34 55 89\nnext: 144\n", hidden: true },
          ],
        },
        {
          title: "Walk a tree with yield from",
          prompt: `A tree arrives as a nested list literal: a list is a node whose first element is its value and whose remaining elements are child nodes. Write a generator \`walk(node, depth=0)\` that yields \`(depth, value)\` pairs in pre-order, delegating to children with \`yield from\`. Print each pair as \`<depth>:<value>\`, then the maximum depth.

**Input:** one nested list literal (parse with \`ast.literal_eval\`).
**Output:** one line per node, then \`max depth <d>\`.

\`\`\`text
["root", ["a", ["a1"]], ["b"]]
\`\`\`
prints
\`\`\`text
0:root
1:a
2:a1
1:b
max depth 2
\`\`\``,
          starter: String.raw`import ast


def walk(node, depth=0):
    # TODO: yield (depth, node[0]); yield from children
    yield depth, node[0]


tree = ast.literal_eval(input())
deepest = 0
for depth, value in walk(tree):
    print(f"{depth}:{value}")
    deepest = max(deepest, depth)
print(f"max depth {deepest}")
`,
          solution: String.raw`import ast


def walk(node, depth=0):
    yield depth, node[0]
    for child in node[1:]:
        yield from walk(child, depth + 1)


tree = ast.literal_eval(input())
deepest = 0
for depth, value in walk(tree):
    print(f"{depth}:{value}")
    deepest = max(deepest, depth)
print(f"max depth {deepest}")
`,
          hints: [
            "`yield from walk(child, depth + 1)` forwards every pair the child's walk produces.",
            "Pre-order means the node's own value is yielded before its children.",
          ],
          cases: [
            { stdin: "[\"root\", [\"a\", [\"a1\"]], [\"b\"]]\n", expected: "0:root\n1:a\n2:a1\n1:b\nmax depth 2\n" },
            { stdin: "[\"only\"]\n", expected: "0:only\nmax depth 0\n", hidden: true },
            { stdin: "[1, [2, [3, [4]]], [5]]\n", expected: "0:1\n1:2\n2:3\n3:4\n1:5\nmax depth 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does calling a generator function do?",
          options: ["Runs the body to the first `yield`", "Returns a generator object without running the body", "Returns a list", "Runs the whole body"],
          answer: 1,
          explanation: "The body runs only when `next()` is called; that is what makes generators lazy.",
        },
        {
          prompt: "What does `yield from sub` do?",
          options: ["Yields the iterable `sub` as one value", "Yields each value of `sub` in turn, and forwards `send`/`throw`", "Returns `sub`", "Raises `StopIteration`"],
          answer: 1,
          explanation: "It delegates to a sub-iterator; recursive traversals are its main use.",
        },
        {
          prompt: "What happens with `list(count_forever())` where the generator never returns?",
          options: ["An empty list", "The program never finishes (or runs out of memory)", "`StopIteration`", "A list of `None`"],
          answer: 1,
          explanation: "`list` pulls until `StopIteration`, which never comes; bound infinite generators with `islice` or `next`.",
        },
        {
          prompt: "How is a generator ended from inside?",
          options: ["`raise StopIteration`", "`return`, optionally with a value", "`yield None`", "`break`"],
          answer: 1,
          explanation: "`return` ends it; a manual `raise StopIteration` inside a generator becomes `RuntimeError` since 3.7.",
        },
        {
          prompt: "Why is writing `__iter__` as a generator a good way to make a class iterable?",
          options: ["It is faster than a list", "Each call creates a fresh generator, so the object can be iterated repeatedly and the state is the generator's locals", "It makes the class hashable", "It avoids `StopIteration`"],
          answer: 1,
          explanation: "The container stays re-iterable and the traversal logic reads top to bottom.",
        },
      ],
    },
    {
      slug: "generator-expressions",
      file: "03-generator-expressions.md",
      exercises: [
        {
          title: "Short-circuit drills",
          prompt: `Read a threshold and a line of integers. With generator expressions only (no lists), print: whether any value exceeds the threshold; whether all values are positive; the first value exceeding the threshold or \`none\` (using \`next\` with a default); how many exceed it (\`sum\`); and the values that exceed it joined by commas (\`join\` over a generator of strings).

**Input:** the threshold, then a line of integers.
**Output:** \`any <bool>\`, \`all-positive <bool>\`, \`first <v|none>\`, \`count <n>\`, \`above <a,b,…>\` (or \`above none\`).

\`\`\`text
5
3 8 1 9
\`\`\`
prints
\`\`\`text
any True
all-positive True
first 8
count 2
above 8,9
\`\`\``,
          starter: String.raw`t = int(input())
xs = list(map(int, input().split()))
# TODO: five lines, each from a generator expression
`,
          solution: String.raw`t = int(input())
xs = list(map(int, input().split()))
print(f"any {any(x > t for x in xs)}")
print(f"all-positive {all(x > 0 for x in xs)}")
print(f"first {next((x for x in xs if x > t), 'none')}")
print(f"count {sum(1 for x in xs if x > t)}")
above = ",".join(str(x) for x in xs if x > t)
print(f"above {above if above else 'none'}")
`,
          hints: [
            "`next(gen, default)` needs the generator in its own parentheses because there is a second argument.",
            "`all(...)` of an empty input is `True` — vacuous truth.",
          ],
          cases: [
            { stdin: "5\n3 8 1 9\n", expected: "any True\nall-positive True\nfirst 8\ncount 2\nabove 8,9\n" },
            { stdin: "10\n1 2 3\n", expected: "any False\nall-positive True\nfirst none\ncount 0\nabove none\n", hidden: true },
            { stdin: "0\n\n", expected: "any False\nall-positive True\nfirst none\ncount 0\nabove none\n", hidden: true },
            { stdin: "-2\n-5 -1 0\n", expected: "any True\nall-positive False\nfirst -1\ncount 2\nabove -1,0\n", hidden: true },
          ],
        },
        {
          title: "Lazy versus eager, traced",
          prompt: `\`compute(i)\` prints \`compute <i>\` and returns \`i * i\`. Read \`n\` and \`target\`. First evaluate \`any(compute(i) > target for i in range(n))\` — a generator expression, which stops at the first hit — then \`any([compute(i) > target for i in range(n)])\` — a list comprehension, which computes everything first. Print the trace lines as they happen and the two results as \`lazy <bool>\` and \`eager <bool>\`.

**Input:** \`n target\`.
**Output:** the trace and the two result lines.

\`\`\`text
4 3
\`\`\`
prints
\`\`\`text
compute 0
compute 1
compute 2
lazy True
compute 0
compute 1
compute 2
compute 3
eager True
\`\`\``,
          starter: String.raw`def compute(i):
    print(f"compute {i}")
    return i * i


n, target = map(int, input().split())
# TODO: lazy any, then eager any
`,
          solution: String.raw`def compute(i):
    print(f"compute {i}")
    return i * i


n, target = map(int, input().split())
print(f"lazy {any(compute(i) > target for i in range(n))}")
print(f"eager {any([compute(i) > target for i in range(n)])}")
`,
          hints: [
            "`any` stops asking the generator as soon as it sees a true value.",
            "The list comprehension runs to completion before `any` looks at anything.",
          ],
          cases: [
            { stdin: "4 3\n", expected: "compute 0\ncompute 1\ncompute 2\nlazy True\ncompute 0\ncompute 1\ncompute 2\ncompute 3\neager True\n" },
            { stdin: "3 100\n", expected: "compute 0\ncompute 1\ncompute 2\nlazy False\ncompute 0\ncompute 1\ncompute 2\neager False\n", hidden: true },
            { stdin: "2 -1\n", expected: "compute 0\nlazy True\ncompute 0\ncompute 1\neager True\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `type(x for x in range(3))`?",
          options: ["`list`", "`generator`", "`tuple`", "`range`"],
          answer: 1,
          explanation: "Parentheses make a generator expression — lazy and one-shot.",
        },
        {
          prompt: "Which is the memory-frugal spelling?",
          options: ["`sum([x * x for x in big])`", "`sum(x * x for x in big)`", "`sum(list(map(sq, big)))`", "They are identical"],
          answer: 1,
          explanation: "The generator feeds `sum` one value at a time; the list version allocates all of them first.",
        },
        {
          prompt: "What does `next((x for x in xs if p(x)), None)` return when nothing matches?",
          options: ["`StopIteration`", "`None`", "`[]`", "`False`"],
          answer: 1,
          explanation: "The default replaces the exception — the 'first that matches' idiom.",
        },
        {
          prompt: "Why does `any([f(x) for x in xs])` lose the short-circuit?",
          options: ["`any` does not short-circuit", "The list comprehension evaluates every `f(x)` before `any` runs", "Lists are always evaluated twice", "It does not lose it"],
          answer: 1,
          explanation: "Only a lazy generator lets `any` stop at the first true value.",
        },
        {
          prompt: "When is a generator expression created, and when does its body run?",
          options: ["Both immediately", "The first `for` iterable is evaluated immediately; the body runs as values are pulled", "Both when consumed", "The body runs immediately; the iterable lazily"],
          answer: 1,
          explanation: "That is why an error in the source surfaces at creation while later clauses are lazy.",
        },
      ],
    },
    {
      slug: "itertools",
      file: "04-itertools.md",
      exercises: [
        {
          title: "Runs with groupby",
          prompt: `Read a line of text. Print its run-length encoding built with \`itertools.groupby\` (each run as the character followed by its length, e.g. \`aaab\` → \`a3b1\`; an empty line prints \`(empty)\`). Then split the line into words, sort them, and group them by first letter with \`groupby\` and a key function — printing \`<letter>: <words>\` per group.

**Input:** one line.
**Output:** \`rle: <code>\`, then one line per first-letter group (none for an empty line).

\`\`\`text
apple avocado banana
\`\`\`
prints
\`\`\`text
rle: a1p2l1e1 1a1v1o1c1a1d1o1 1b1a1n1a1n1a1
a: apple avocado
b: banana
\`\`\``,
          starter: String.raw`from itertools import groupby

line = input().rstrip("\n")
# TODO: rle via groupby over the characters
# TODO: groups by first letter over the sorted words
`,
          solution: String.raw`from itertools import groupby

line = input().rstrip("\n")
rle = "".join(f"{ch}{sum(1 for _ in run)}" for ch, run in groupby(line))
print("rle:", rle if rle else "(empty)")
for letter, words in groupby(sorted(line.split()), key=lambda w: w[0]):
    print(f"{letter}: {' '.join(words)}")
`,
          hints: [
            "`groupby(line)` groups consecutive equal characters; each run is an iterator to count.",
            "Sorting the words first makes every word with the same first letter consecutive — otherwise `groupby` would produce repeated groups.",
          ],
          cases: [
            { stdin: "apple avocado banana\n", expected: "rle: a1p2l1e1 1a1v1o1c1a1d1o1 1b1a1n1a1n1a1\na: apple avocado\nb: banana\n" },
            { stdin: "\n", expected: "rle: (empty)\n", hidden: true },
            { stdin: "zzz\n", expected: "rle: z3\nz: zzz\n", hidden: true },
            { stdin: "bob alice bea\n", expected: "rle: b1o1b1 1a1l1i1c1e1 1b1e1a1\na: alice\nb: bea bob\n", hidden: true },
          ],
        },
        {
          title: "Combinatoric counts",
          prompt: `Read a string of distinct characters and \`r\`. Using \`itertools\`, print the number of permutations of length \`r\` and the first three (joined), the number of combinations and the first three, and how many tuples from \`product((0, 1), repeat=len(items))\` contain exactly \`r\` ones.

**Input:** \`items r\`.
**Output:** \`perms <n>: <first three>\`, \`combs <n>: <first three>\`, \`bits <n>\`.

\`\`\`text
abc 2
\`\`\`
prints
\`\`\`text
perms 6: ab ac ba
combs 3: ab ac bc
bits 3
\`\`\``,
          starter: String.raw`from itertools import permutations, combinations, product, islice

items, r = input().split()
r = int(r)
# TODO
`,
          solution: String.raw`from itertools import permutations, combinations, product, islice

items, r = input().split()
r = int(r)
perms = list(permutations(items, r))
combs = list(combinations(items, r))
print(f"perms {len(perms)}:", " ".join("".join(p) for p in islice(perms, 3)))
print(f"combs {len(combs)}:", " ".join("".join(c) for c in islice(combs, 3)))
print(f"bits {sum(1 for t in product((0, 1), repeat=len(items)) if sum(t) == r)}")
`,
          hints: [
            "`permutations` are ordered arrangements, `combinations` unordered subsets, both in input order.",
            "`product((0, 1), repeat=n)` enumerates every n-bit tuple; count those whose sum is `r`.",
          ],
          cases: [
            { stdin: "abc 2\n", expected: "perms 6: ab ac ba\ncombs 3: ab ac bc\nbits 3\n" },
            { stdin: "wxyz 1\n", expected: "perms 4: w x y\ncombs 4: w x y\nbits 4\n", hidden: true },
            { stdin: "ab 3\n", expected: "perms 0:\ncombs 0:\nbits 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `list(groupby(\"aabba\"))` group?",
          options: ["Two groups: all `a`s and all `b`s", "Three groups of consecutive runs: `aa`, `bb`, `a`", "Five single-character groups", "It raises"],
          answer: 1,
          explanation: "`groupby` is a run detector; sort first for whole-data grouping.",
        },
        {
          prompt: "Which bounds an infinite `itertools.count()`?",
          options: ["`list(count())`", "`islice(count(), 10)`", "`len(count())`", "`sorted(count())`"],
          answer: 1,
          explanation: "`islice`, `takewhile`, `next` or a finite `zip` partner stop an infinite iterator; the others consume forever.",
        },
        {
          prompt: "What is `list(product(\"ab\", repeat=2))`?",
          options: ["`[('a', 'b')]`", "`[('a','a'), ('a','b'), ('b','a'), ('b','b')]`", "`[('a','b'), ('b','a')]`", "`['aa', 'ab', 'ba', 'bb']`"],
          answer: 1,
          explanation: "The cartesian product with itself — every ordered pair, as tuples.",
        },
        {
          prompt: "What does `chain.from_iterable([[1, 2], [3]])` produce?",
          options: ["`[[1, 2], [3]]`", "`1, 2, 3` lazily — a one-level flatten", "`[1, 2, 3]` as a list", "`TypeError`"],
          answer: 1,
          explanation: "It yields the elements of each inner iterable in turn without building a list.",
        },
        {
          prompt: "What does `accumulate([1, 2, 3])` yield?",
          options: ["`6`", "`1, 3, 6` — running totals", "`1, 2, 3`", "`0, 1, 3, 6`"],
          answer: 1,
          explanation: "Prefix sums as an iterator; `initial=0` would prepend the zero and `func=` changes the operation.",
        },
      ],
    },
    {
      slug: "functools-and-operator",
      file: "05-functools-and-operator.md",
      exercises: [
        {
          title: "Cache statistics",
          prompt: `Decorate a recursive \`fib\` with \`functools.lru_cache(maxsize=None)\`, read \`n\`, print \`fib(n)\` and the cache's hits and misses from \`cache_info()\`. Then build \`double = partial(operator.mul, 2)\` and print \`double(fib(n))\`. Finally use \`reduce\` with \`operator.mul\` and an initial value of 1 to print the product of \`1..n\`.

**Input:** \`n\`.
**Output:** \`fib <v>\`, \`hits <h> misses <m>\`, \`double <v>\`, \`factorial <v>\`.

\`\`\`text
10
\`\`\`
prints
\`\`\`text
fib 55
hits 8 misses 11
double 110
factorial 3628800
\`\`\``,
          starter: String.raw`import operator
from functools import lru_cache, partial, reduce


# TODO: @lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


n = int(input())
# TODO
`,
          solution: String.raw`import operator
from functools import lru_cache, partial, reduce


@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


n = int(input())
value = fib(n)
info = fib.cache_info()
print(f"fib {value}")
print(f"hits {info.hits} misses {info.misses}")
double = partial(operator.mul, 2)
print(f"double {double(value)}")
print(f"factorial {reduce(operator.mul, range(1, n + 1), 1)}")
`,
          hints: [
            "`cache_info()` returns a named tuple with `hits` and `misses` — read it before any further calls change it.",
            "`partial(operator.mul, 2)` fixes the first argument; `reduce(..., 1)` needs the initial value for `n = 0`.",
          ],
          cases: [
            { stdin: "10\n", expected: "fib 55\nhits 8 misses 11\ndouble 110\nfactorial 3628800\n" },
            { stdin: "0\n", expected: "fib 0\nhits 0 misses 1\ndouble 0\nfactorial 1\n", hidden: true },
            { stdin: "2\n", expected: "fib 1\nhits 0 misses 3\ndouble 2\nfactorial 2\n", hidden: true },
          ],
        },
        {
          title: "Describe with singledispatch",
          prompt: `Write \`describe(value)\` with \`functools.singledispatch\`: the default returns \`other <type name>\`; registrations for \`int\` (\`int <v>\`; note \`bool\` is an \`int\`), \`str\` (\`str of <len>\`), \`list\` (\`list of <len>\`) and \`dict\` (\`dict with keys <sorted keys>\`). Read literals one per line (parse with \`ast.literal_eval\`) and print each description.

**Input:** literal lines.
**Output:** one line per literal.

\`\`\`text
42
"hey"
[1, 2, 3]
{"b": 1, "a": 2}
3.5
\`\`\`
prints
\`\`\`text
int 42
str of 3
list of 3
dict with keys a b
other float
\`\`\``,
          starter: String.raw`import ast
import sys
from functools import singledispatch


@singledispatch
def describe(value):
    return f"other {type(value).__name__}"


# TODO: register int, str, list, dict


for line in sys.stdin:
    print(describe(ast.literal_eval(line.strip())))
`,
          solution: String.raw`import ast
import sys
from functools import singledispatch


@singledispatch
def describe(value):
    return f"other {type(value).__name__}"


@describe.register
def _(value: int):
    return f"int {value}"


@describe.register
def _(value: str):
    return f"str of {len(value)}"


@describe.register
def _(value: list):
    return f"list of {len(value)}"


@describe.register
def _(value: dict):
    return f"dict with keys {' '.join(sorted(value))}"


for line in sys.stdin:
    print(describe(ast.literal_eval(line.strip())))
`,
          hints: [
            "`@describe.register` reads the type from the annotation of the first parameter.",
            "Dispatch follows the MRO, so `True` (a `bool`, subclass of `int`) uses the `int` implementation.",
          ],
          cases: [
            { stdin: "42\n\"hey\"\n[1, 2, 3]\n{\"b\": 1, \"a\": 2}\n3.5\n", expected: "int 42\nstr of 3\nlist of 3\ndict with keys a b\nother float\n" },
            { stdin: "True\nNone\n(1, 2)\n", expected: "int True\nother NoneType\nother tuple\n", hidden: true },
            { stdin: "\"\"\n[]\n{}\n", expected: "str of 0\nlist of 0\ndict with keys \n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `@lru_cache(maxsize=128)` do that `@cache` does not?",
          options: ["Caches only integers", "Bounds the cache, evicting the least recently used entries", "Makes the function faster", "Allows unhashable arguments"],
          answer: 1,
          explanation: "`cache` is unbounded; `lru_cache` with a size keeps memory bounded for open-ended inputs.",
        },
        {
          prompt: "What is `partial(int, base=2)(\"101\")`?",
          options: ["`\"101\"`", "`5`", "`101`", "`TypeError`"],
          answer: 1,
          explanation: "The keyword `base=2` is fixed; the call supplies the string.",
        },
        {
          prompt: "Why pass an initial value to `reduce`?",
          options: ["It is required syntax", "An empty iterable raises `TypeError` without it, and the fold has a defined start", "It makes `reduce` lazy", "To reverse the fold"],
          answer: 1,
          explanation: "Without `initial`, the first element seeds the fold and nothing seeds an empty one.",
        },
        {
          prompt: "What does `@wraps(fn)` preserve on a wrapper?",
          options: ["Its return type", "`__name__`, `__doc__`, `__module__`, `__qualname__` and `__wrapped__`", "Its performance", "Its default arguments"],
          answer: 1,
          explanation: "Without it, decorated functions all report the wrapper's name in tracebacks and `help`.",
        },
        {
          prompt: "On which argument does `singledispatch` dispatch?",
          options: ["All arguments", "The type of the first argument", "The return type", "The keyword arguments"],
          answer: 1,
          explanation: "Single dispatch by definition; subclasses match their nearest registered base.",
        },
      ],
    },
    {
      slug: "lazy-pipelines",
      file: "06-lazy-pipelines.md",
      exercises: [
        {
          title: "Purchase pipeline",
          prompt: `Build a pipeline of generator stages over lines \`user action amount\`: \`read_lines\` strips and drops blank lines; \`parse\` yields \`(user, action, int(amount))\`, counting malformed lines (wrong field count or non-integer amount) in a mutable counter list instead of raising; \`only_buys\` keeps \`action == "buy"\`; \`summarise\` consumes the stream into a per-user total. Print each user's total in name order, then \`skipped <n>\`.

**Input:** lines.
**Output:** \`<user> <total>\` lines, then \`skipped <n>\`.

\`\`\`text
ada buy 30
bob sell 10
ada buy 20
garbage
bob buy x
\`\`\`
prints
\`\`\`text
ada 50
skipped 2
\`\`\``,
          starter: String.raw`import sys


def read_lines(stream):
    for line in stream:
        line = line.strip()
        if line:
            yield line


def parse(lines, skipped):
    # TODO: yield (user, action, amount); skipped[0] += 1 on a bad line
    pass


def only_buys(records):
    # TODO
    pass


def summarise(records):
    totals = {}
    # TODO
    return totals


skipped = [0]
totals = summarise(only_buys(parse(read_lines(sys.stdin), skipped)))
for user in sorted(totals):
    print(user, totals[user])
print(f"skipped {skipped[0]}")
`,
          solution: String.raw`import sys


def read_lines(stream):
    for line in stream:
        line = line.strip()
        if line:
            yield line


def parse(lines, skipped):
    for line in lines:
        parts = line.split()
        if len(parts) != 3:
            skipped[0] += 1
            continue
        user, action, amount = parts
        try:
            yield user, action, int(amount)
        except ValueError:
            skipped[0] += 1


def only_buys(records):
    for record in records:
        if record[1] == "buy":
            yield record


def summarise(records):
    totals = {}
    for user, _, amount in records:
        totals[user] = totals.get(user, 0) + amount
    return totals


skipped = [0]
totals = summarise(only_buys(parse(read_lines(sys.stdin), skipped)))
for user in sorted(totals):
    print(user, totals[user])
print(f"skipped {skipped[0]}")
`,
          hints: [
            "Each stage takes an iterable and yields; only `summarise` consumes.",
            "The `try` around the `yield` is fine here: `int(amount)` is evaluated before the value is yielded.",
          ],
          cases: [
            { stdin: "ada buy 30\nbob sell 10\nada buy 20\ngarbage\nbob buy x\n", expected: "ada 50\nskipped 2\n" },
            { stdin: "\n\n", expected: "skipped 0\n", hidden: true },
            { stdin: "z buy 1\na buy 2\nz buy 3\n", expected: "a 2\nz 4\nskipped 0\n", hidden: true },
          ],
        },
        {
          title: "Sliding windows over a stream",
          prompt: `Implement the \`sliding_window(iterable, n)\` recipe with a bounded \`deque\` and \`islice\`, yielding each full window as a tuple. Read \`n\` and then integers **one per line** (a stream), pass the parsed stream through the generator, and print each window's mean with two decimals as it becomes available. Print \`no window\` if the stream never fills one.

**Input:** \`n\`, then integer lines.
**Output:** one mean per full window, or \`no window\`.

\`\`\`text
3
1
2
3
4
\`\`\`
prints
\`\`\`text
2.00
3.00
\`\`\``,
          starter: String.raw`import sys
from collections import deque
from itertools import islice


def sliding_window(iterable, n):
    # TODO
    yield ()


n = int(input())
stream = (int(line) for line in sys.stdin if line.strip())
count = 0
for window in sliding_window(stream, n):
    print(f"{sum(window) / n:.2f}")
    count += 1
if count == 0:
    print("no window")
`,
          solution: String.raw`import sys
from collections import deque
from itertools import islice


def sliding_window(iterable, n):
    it = iter(iterable)
    window = deque(islice(it, n), maxlen=n)
    if len(window) == n:
        yield tuple(window)
    for x in it:
        window.append(x)
        yield tuple(window)


n = int(input())
stream = (int(line) for line in sys.stdin if line.strip())
count = 0
for window in sliding_window(stream, n):
    print(f"{sum(window) / n:.2f}")
    count += 1
if count == 0:
    print("no window")
`,
          hints: [
            "Take the first `n` items with `islice` from the *same* iterator the loop continues from.",
            "A `deque(maxlen=n)` drops the oldest value on each append, so every yield is a full window.",
          ],
          cases: [
            { stdin: "3\n1\n2\n3\n4\n", expected: "2.00\n3.00\n" },
            { stdin: "2\n5\n", expected: "no window\n", hidden: true },
            { stdin: "1\n7\n-7\n", expected: "7.00\n-7.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the contract of a pipeline stage?",
          options: ["Takes a list, returns a list", "Takes any iterable, yields values lazily", "Takes a file, prints results", "Takes a string, returns a string"],
          answer: 1,
          explanation: "That contract makes stages composable and testable with plain lists.",
        },
        {
          prompt: "When does work in a generator pipeline actually happen?",
          options: ["When each stage is created", "When the final consumer pulls values", "At import time", "When `main` returns"],
          answer: 1,
          explanation: "Nothing runs until something iterates the last stage; each record then flows through every stage in turn.",
        },
        {
          prompt: "Where should a malformed input line be handled?",
          options: ["In the aggregator", "In the parsing stage, which knows the line and its number", "In `main` after the pipeline", "Nowhere — let it crash"],
          answer: 1,
          explanation: "The stage with the context can report or skip meaningfully; downstream stages only see records.",
        },
        {
          prompt: "Why parse into frozen dataclass records rather than tuples or dicts?",
          options: ["They are faster", "Named fields read clearly, and immutability stops a downstream stage corrupting an upstream object", "Tuples cannot be yielded", "Dicts are not iterable"],
          answer: 1,
          explanation: "`hit.status` beats `hit[3]`, and a transform must create a new record rather than mutate a shared one.",
        },
        {
          prompt: "What breaks a lazy pipeline?",
          options: ["Using `yield`", "A stage that returns a list, forcing everything before it to be materialised", "Using a dataclass", "Sorting at the end"],
          answer: 1,
          explanation: "One eager stage makes the whole upstream chain run to completion before anything downstream starts.",
        },
      ],
    },
    {
      slug: "iterators-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Run-length codec with groupby",
          prompt: `Each line is \`E <text>\` or \`D <code>\`. Encode with \`itertools.groupby\` — each run becomes the character followed by its count (\`aaabcc\` → \`a3b1c2\`). Decode by scanning the code: a character followed by one or more digits (a generator that yields the expanded characters, joined at the end). Text after the command is taken literally.

**Input:** lines.
**Output:** one line per input line (an empty result prints \`(empty)\`).

\`\`\`text
E aaabcc
D a3b1c2
\`\`\`
prints
\`\`\`text
a3b1c2
aaabcc
\`\`\``,
          starter: String.raw`import sys
from itertools import groupby


def encode(text):
    # TODO: groupby
    return text


def expand(code):
    # TODO: a generator yielding ch * count for each (char, digits) unit
    yield code


for line in sys.stdin:
    cmd, _, rest = line.rstrip("\n").partition(" ")
    result = encode(rest) if cmd == "E" else "".join(expand(rest))
    print(result if result else "(empty)")
`,
          solution: String.raw`import sys
from itertools import groupby


def encode(text):
    return "".join(f"{ch}{sum(1 for _ in run)}" for ch, run in groupby(text))


def expand(code):
    i = 0
    while i < len(code):
        ch = code[i]
        j = i + 1
        while j < len(code) and code[j].isdigit():
            j += 1
        yield ch * int(code[i + 1:j])
        i = j


for line in sys.stdin:
    cmd, _, rest = line.rstrip("\n").partition(" ")
    result = encode(rest) if cmd == "E" else "".join(expand(rest))
    print(result if result else "(empty)")
`,
          hints: [
            "`groupby(text)` with no key groups consecutive equal characters; count each run's iterator.",
            "The decoder is the hand scanner from Module 5 written as a generator — `yield` instead of `append`.",
          ],
          cases: [
            { stdin: "E aaabcc\nD a3b1c2\n", expected: "a3b1c2\naaabcc\n" },
            { stdin: "D x10\nE \nE a\n", expected: "xxxxxxxxxx\n(empty)\na1\n", hidden: true },
            { stdin: "E aa bb\nD  2a1\n", expected: "a2 1b2\n  a\n", hidden: true },
          ],
        },
        {
          title: "Subset sum, first hit",
          prompt: `Read a target and a line of positive integers. Search the combinations of indexes by increasing size (1, 2, …, all) with \`itertools.combinations\`, in the order \`combinations\` produces them, and stop at the **first** combination whose values sum to the target — using \`next\` over a generator expression chained across sizes with \`itertools.chain.from_iterable\`. Print the chosen values or \`none\`.

**Input:** the target, then a line of integers.
**Output:** \`found <values>\` or \`none\`.

\`\`\`text
9
2 7 5 4
\`\`\`
prints
\`\`\`text
found 2 7
\`\`\``,
          starter: String.raw`from itertools import combinations, chain

target = int(input())
xs = list(map(int, input().split()))
# TODO: candidates = chain.from_iterable(combinations(xs, r) for r in range(1, len(xs) + 1))
#       hit = next((c for c in candidates if sum(c) == target), None)
`,
          solution: String.raw`from itertools import combinations, chain

target = int(input())
xs = list(map(int, input().split()))
candidates = chain.from_iterable(combinations(xs, r) for r in range(1, len(xs) + 1))
hit = next((c for c in candidates if sum(c) == target), None)
print("found", " ".join(map(str, hit))) if hit else print("none")
`,
          hints: [
            "Chaining the size-r combination iterators gives smaller subsets first, lazily.",
            "`next` stops at the first match, so larger sizes are never generated when a small subset works.",
          ],
          cases: [
            { stdin: "9\n2 7 5 4\n", expected: "found 2 7\n" },
            { stdin: "100\n1 2 3\n", expected: "none\n", hidden: true },
            { stdin: "6\n1 2 3\n", expected: "found 1 2 3\n", hidden: true },
            { stdin: "5\n5 1 4\n", expected: "found 5\n", hidden: true },
          ],
        },
        {
          title: "Log pipeline",
          prompt: `Process log lines \`ip method path status size\` through generator stages: \`read_lines\` (strip, drop blank), \`parse\` (yield a tuple with \`status\` and \`size\` as ints; skip lines with the wrong field count or non-integer fields), \`only(method="GET")\`, and a single-pass \`summarise\` that returns status counts, path counts and total bytes. Print \`status <code>: <n>\` in ascending order, \`bytes <total>\`, and \`top <path>\` (most requests, ties alphabetical) or \`top none\`.

**Input:** lines.
**Output:** the summary.

\`\`\`text
1.1.1.1 GET /a 200 100
1.1.1.2 POST /a 200 50
1.1.1.1 GET /b 404 0
bad line
\`\`\`
prints
\`\`\`text
status 200: 1
status 404: 1
bytes 100
top /a
\`\`\``,
          starter: String.raw`import sys
from collections import Counter


def read_lines(stream):
    for line in stream:
        line = line.strip()
        if line:
            yield line


def parse(lines):
    # TODO
    pass


def only(records, *, method):
    # TODO
    pass


def summarise(records):
    by_status, by_path, total = Counter(), Counter(), 0
    # TODO
    return by_status, by_path, total


by_status, by_path, total = summarise(only(parse(read_lines(sys.stdin)), method="GET"))
for status in sorted(by_status):
    print(f"status {status}: {by_status[status]}")
print(f"bytes {total}")
print("top", min(by_path, key=lambda p: (-by_path[p], p)) if by_path else "none")
`,
          solution: String.raw`import sys
from collections import Counter


def read_lines(stream):
    for line in stream:
        line = line.strip()
        if line:
            yield line


def parse(lines):
    for line in lines:
        parts = line.split()
        if len(parts) != 5:
            continue
        ip, method, path, status, size = parts
        try:
            yield ip, method, path, int(status), int(size)
        except ValueError:
            continue


def only(records, *, method):
    for record in records:
        if record[1] == method:
            yield record


def summarise(records):
    by_status, by_path, total = Counter(), Counter(), 0
    for _, _, path, status, size in records:
        by_status[status] += 1
        by_path[path] += 1
        total += size
    return by_status, by_path, total


by_status, by_path, total = summarise(only(parse(read_lines(sys.stdin)), method="GET"))
for status in sorted(by_status):
    print(f"status {status}: {by_status[status]}")
print(f"bytes {total}")
print("top", min(by_path, key=lambda p: (-by_path[p], p)) if by_path else "none")
`,
          hints: [
            "One pass in `summarise` fills all three accumulators; nothing upstream is stored.",
            "The `try` around `yield` with the `int` conversions inside is safe because the conversions run before the value is produced.",
          ],
          cases: [
            { stdin: "1.1.1.1 GET /a 200 100\n1.1.1.2 POST /a 200 50\n1.1.1.1 GET /b 404 0\nbad line\n", expected: "status 200: 1\nstatus 404: 1\nbytes 100\ntop /a\n" },
            { stdin: "x POST /p 200 1\n", expected: "bytes 0\ntop none\n", hidden: true },
            { stdin: "a GET /z 200 5\nb GET /y 200 5\nc GET /y 500 1\n", expected: "status 200: 2\nstatus 500: 1\nbytes 11\ntop /y\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which object is an iterator?",
          options: ["`[1, 2, 3]`", "`iter([1, 2, 3])`", "`\"abc\"`", "`range(3)`"],
          answer: 1,
          explanation: "The others are iterables that produce iterators on demand.",
        },
        {
          prompt: "What does `next(it)` do on an exhausted iterator?",
          options: ["Returns `None`", "Raises `StopIteration`", "Restarts", "Returns the last value"],
          answer: 1,
          explanation: "Pass a default as the second argument to avoid the exception.",
        },
        {
          prompt: "What does this print?\n\n```python\ndef g():\n    print(\"start\")\n    yield 1\n\nx = g()\nprint(\"made\")\nnext(x)\n```",
          options: ["`start` then `made`", "`made` then `start`", "`start` only", "`made` only"],
          answer: 1,
          explanation: "The body does not run until `next`; creating the generator prints nothing.",
        },
        {
          prompt: "What is `sum(x for x in range(4))`?",
          options: ["`6`", "`SyntaxError`", "`[0, 1, 2, 3]`", "`10`"],
          answer: 0,
          explanation: "A generator expression as the sole argument needs no extra parentheses; 0 + 1 + 2 + 3 = 6.",
        },
        {
          prompt: "Which `itertools` call yields `(1, 2), (2, 3), (3, 4)` from `[1, 2, 3, 4]`?",
          options: ["`combinations(xs, 2)`", "`pairwise(xs)`", "`product(xs, xs)`", "`zip(xs)`"],
          answer: 1,
          explanation: "`pairwise` gives consecutive pairs; `combinations` would include `(1, 3)` and `(1, 4)`.",
        },
        {
          prompt: "How many elements does `permutations(\"abcd\", 2)` produce?",
          options: ["6", "12", "16", "24"],
          answer: 1,
          explanation: "Ordered pairs without repetition: 4 × 3 = 12. `combinations` would give 6.",
        },
        {
          prompt: "Why sort before `groupby` to group by a key?",
          options: ["`groupby` requires sorted input or raises", "`groupby` groups consecutive runs only, so equal keys must be adjacent", "Sorting is faster", "It does not matter"],
          answer: 1,
          explanation: "Unsorted input gives one group per run, not per key.",
        },
        {
          prompt: "What does `functools.cache` require of arguments?",
          options: ["They must be ints", "They must be hashable", "They must be positional", "Nothing"],
          answer: 1,
          explanation: "The cache is a dict keyed by the arguments; a list argument raises `TypeError`.",
        },
        {
          prompt: "What is `reduce(operator.add, [], 0)`?",
          options: ["`TypeError`", "`0`", "`None`", "`[]`"],
          answer: 1,
          explanation: "With an initial value, an empty fold returns it; without one it raises.",
        },
        {
          prompt: "What does `itemgetter(1, 0)` return when called on `(\"a\", \"b\")`?",
          options: ["`\"b\"`", "`(\"b\", \"a\")`", "`[\"b\", \"a\"]`", "`\"a\"`"],
          answer: 1,
          explanation: "With several indexes, `itemgetter` returns a tuple — the multi-key sort key.",
        },
        {
          prompt: "In a pipeline, which stage is *not* a generator?",
          options: ["The parser", "The filter", "The final aggregator, which consumes the stream and returns a result", "The source"],
          answer: 2,
          explanation: "Every stage yields except the terminal consumer, which pulls everything through.",
        },
        {
          prompt: "What does `tee(it, 2)` cost?",
          options: ["Nothing — it duplicates the iterator", "Buffering of every value one copy has consumed and the other has not", "A full copy of the source list", "It re-runs the source"],
          answer: 1,
          explanation: "Two readers advancing at different rates keep the difference in memory; do not use the original after tee-ing.",
        },
      ],
    },
  ],
});
