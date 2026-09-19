import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "functions",
  title: "Functions",
  blurb: "def and return, the full signature with defaults, *args, **kwargs and keyword-only parameters, LEGB scope with closures and late binding, recursion with memoisation, lambdas and the key-function idiom, and the type hints and docstrings that publish a function's contract.",
  icon: "function",
  overview: `A Python function is an object: created by \`def\`, bound to a name, passed around like any value, and called with parentheses. That is the fact this module keeps returning to, because it explains the key-function idiom, closures, decorators, dispatch tables and the mutable-default trap all at once. The module also fixes the one scoping rule — assignment makes a name local to the whole function — that produces \`UnboundLocalError\`, motivates \`global\` and \`nonlocal\`, and gives closures their late-binding behaviour.

Defining functions covers \`return\`, the \`None\` that comes back otherwise, the in-place methods that return it on purpose, and the discipline of I/O in \`main\` with pure helpers. Parameters and arguments takes the signature apart: positional and keyword, defaults evaluated once, \`*args\` and \`**kwargs\`, \`*\` and \`/\`, and unpacking at the call. Scope and closures states LEGB, the two keywords, and the loop-variable trap with its fixes. Recursion gives the base-case discipline, the call stack, the depth limit and \`functools.cache\`. Lambdas and higher-order functions covers \`key=\`, \`map\`/\`filter\`, \`partial\`, \`reduce\` and \`operator\`. Type hints and docstrings introduces the annotation vocabulary and PEP 257.

The exercises are whole programs: statistics helpers that return tuples, a pipeline of functions held in a list, an argument echo built on \`*args\`/\`**kwargs\`, the mutable-default bug fixed with \`None\`, a counter factory with \`nonlocal\`, late binding demonstrated and fixed, a recursive flattener, cached Fibonacci, multi-key sorting, a \`partial\`-built pipeline, an annotation report, and a run-time checker driven by \`__annotations__\`. The checkpoint adds memoised grid paths around obstacles, a keyword-only signature exercised through calls that succeed or raise, and function composition from closure factories.`,
  lessons: [
    {
      slug: "defining-functions",
      file: "01-defining-functions.md",
      exercises: [
        {
          title: "Statistics helpers",
          prompt: `Write three pure functions and a \`main\` that does all the input and output. \`min_max(xs)\` returns the smallest and largest values **as a tuple**; \`mean(xs)\` returns the average; \`spread(xs)\` returns \`max - min\`. \`main\` reads the numbers, unpacks the tuple, and prints the report. For an empty input print \`no data\`.

**Input:** one line of integers (possibly empty).
**Output:** \`min <a> max <b> mean <m> spread <s>\` with the mean to two decimals, or \`no data\`.

\`\`\`text
3 1 4 1 5
\`\`\`
prints
\`\`\`text
min 1 max 5 mean 2.80 spread 4
\`\`\``,
          starter: String.raw`def min_max(xs):
    # TODO: return (smallest, largest)
    return 0, 0


def mean(xs):
    # TODO
    return 0.0


def spread(xs):
    # TODO: use min_max
    return 0


def main():
    xs = list(map(int, input().split()))
    # TODO: no data, or the report


if __name__ == "__main__":
    main()
`,
          solution: String.raw`def min_max(xs):
    return min(xs), max(xs)


def mean(xs):
    return sum(xs) / len(xs)


def spread(xs):
    lo, hi = min_max(xs)
    return hi - lo


def main():
    xs = list(map(int, input().split()))
    if not xs:
        print("no data")
        return
    lo, hi = min_max(xs)
    print(f"min {lo} max {hi} mean {mean(xs):.2f} spread {spread(xs)}")


if __name__ == "__main__":
    main()
`,
          hints: [
            "`return a, b` returns a tuple; `lo, hi = min_max(xs)` unpacks it.",
            "Guard the empty case in `main` with an early `return` before calling the helpers.",
          ],
          cases: [
            { stdin: "3 1 4 1 5\n", expected: "min 1 max 5 mean 2.80 spread 4\n" },
            { stdin: "7\n", expected: "min 7 max 7 mean 7.00 spread 0\n", hidden: true },
            { stdin: "\n", expected: "no data\n", hidden: true },
            { stdin: "-2 -8 4\n", expected: "min -8 max 4 mean -2.00 spread 12\n", hidden: true },
          ],
        },
        {
          title: "A pipeline of functions",
          prompt: `Functions are values. The starter defines \`double\`, \`square\`, \`negate\` and \`increment\`. Read a line naming functions in order (possibly empty), build a **list of function objects** from a dictionary of names, then read a line of integers and pass each through the whole list in order.

**Input:** a line of function names, then a line of integers.
**Output:** \`<x> -> <result>\` per integer.

\`\`\`text
double square
1 2 3
\`\`\`
prints
\`\`\`text
1 -> 4
2 -> 16
3 -> 36
\`\`\``,
          starter: String.raw`def double(x):
    return 2 * x


def square(x):
    return x * x


def negate(x):
    return -x


def increment(x):
    return x + 1


TABLE = {"double": double, "square": square, "negate": negate, "increment": increment}

names = input().split()
pipeline = []  # TODO: the function objects named, in order
for x in map(int, input().split()):
    # TODO: apply every function in the pipeline to x, then print
    pass
`,
          solution: String.raw`def double(x):
    return 2 * x


def square(x):
    return x * x


def negate(x):
    return -x


def increment(x):
    return x + 1


TABLE = {"double": double, "square": square, "negate": negate, "increment": increment}

names = input().split()
pipeline = [TABLE[name] for name in names]
for x in map(int, input().split()):
    value = x
    for fn in pipeline:
        value = fn(value)
    print(f"{x} -> {value}")
`,
          hints: [
            "`TABLE[name]` is the function object — no parentheses until you call it.",
            "Keep the original `x` for printing and thread a separate `value` through the loop.",
          ],
          cases: [
            { stdin: "double square\n1 2 3\n", expected: "1 -> 4\n2 -> 16\n3 -> 36\n" },
            { stdin: "negate increment\n5 -5\n", expected: "5 -> -4\n-5 -> 6\n", hidden: true },
            { stdin: "\n8 9\n", expected: "8 -> 8\n9 -> 9\n", hidden: true },
            { stdin: "increment increment double negate\n0\n", expected: "0 -> -4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\ndef f(xs):\n    xs.append(1)\n\nresult = f([])\nprint(result)\n```",
          options: ["`[1]`", "`None`", "`[]`", "`TypeError`"],
          answer: 1,
          explanation: "The function has no `return`, so the call evaluates to `None`. The list was mutated, but the caller never kept a reference to it.",
        },
        {
          prompt: "Why does `xs = xs.sort()` lose the list?",
          options: [
            "`sort` returns a sorted copy but `xs` is reassigned too early",
            "`sort` sorts in place and returns `None`, so `xs` is rebound to `None`",
            "`sort` raises an exception for non-empty lists",
            "It does not — `xs` is sorted",
          ],
          answer: 1,
          explanation: "In-place methods return `None` by convention so that they are not confused with the copying versions. Either call `xs.sort()` alone or use `xs = sorted(xs)`.",
        },
        {
          prompt: "What happens?\n\n```python\nprint(area(2, 3))\n\ndef area(w, h):\n    return w * h\n```",
          options: ["Prints `6`", "`NameError: name 'area' is not defined`", "`SyntaxError`", "Prints `None`"],
          answer: 1,
          explanation: "A `def` binds its name only when executed. The call on line 1 runs before the `def` on line 3 has been reached, so the name does not exist yet.",
        },
        {
          prompt: "What is `type(len)` and what does `if len:` do?",
          options: [
            "`builtin_function_or_method`; the condition is always true because a function object is truthy",
            "`int`; the condition tests whether the length is non-zero",
            "It raises `TypeError` because `len` needs an argument",
            "`NoneType`; the condition is false",
          ],
          answer: 0,
          explanation: "Without parentheses `len` is the function object itself, which is truthy like any object without `__bool__`. The bug is silent, which is why `is_ready` versus `is_ready()` is worth a second look.",
        },
        {
          prompt: "Which docstring follows the convention?",
          options: [
            "`\"\"\"This function takes a list and returns its total.\"\"\"`",
            "`\"\"\"Return the sum of the numbers in xs.\"\"\"`",
            "`# Return the sum of the numbers in xs`",
            "`\"\"\"total()\"\"\"`",
          ],
          answer: 1,
          explanation: "An imperative one-line summary of what the function does for the caller. The first restates the signature in prose, the third is a comment (not stored in `__doc__`), and the last repeats the name.",
        },
      ],
    },
    {
      slug: "parameters-and-arguments",
      file: "02-parameters-and-arguments.md",
      exercises: [
        {
          title: "Echo the arguments",
          prompt: `Write \`describe(*args, **kwargs)\` returning a two-line description of what it was called with, then call it by **unpacking** a list and a dict built from one input line: a token containing \`=\` is a keyword argument (\`name=value\`, both kept as strings), any other token is positional.

**Input:** one line of tokens (possibly empty).
**Output:** \`positional: <values separated by spaces>\` (or \`(none)\`), then \`keyword: <k=v pairs separated by ", ">\` (or \`(none)\`), in the order given.

\`\`\`text
1 2 name=ada age=3
\`\`\`
prints
\`\`\`text
positional: 1 2
keyword: name=ada, age=3
\`\`\``,
          starter: String.raw`def describe(*args, **kwargs):
    # TODO: build the two lines from the tuple and the dict
    return ""


tokens = input().split()
positional = [t for t in tokens if "=" not in t]
keyword = dict(t.split("=", 1) for t in tokens if "=" in t)
print(describe(*positional, **keyword))
`,
          solution: String.raw`def describe(*args, **kwargs):
    pos = " ".join(args) if args else "(none)"
    kw = ", ".join(f"{k}={v}" for k, v in kwargs.items()) if kwargs else "(none)"
    return f"positional: {pos}\nkeyword: {kw}"


tokens = input().split()
positional = [t for t in tokens if "=" not in t]
keyword = dict(t.split("=", 1) for t in tokens if "=" in t)
print(describe(*positional, **keyword))
`,
          hints: [
            "Inside the function `args` is a tuple and `kwargs` a dict that keeps the call's order.",
            "`f(*positional, **keyword)` spreads the list into positionals and the dict into keywords.",
          ],
          cases: [
            { stdin: "1 2 name=ada age=3\n", expected: "positional: 1 2\nkeyword: name=ada, age=3\n" },
            { stdin: "\n", expected: "positional: (none)\nkeyword: (none)\n", hidden: true },
            { stdin: "x=1 y=2\n", expected: "positional: (none)\nkeyword: x=1, y=2\n", hidden: true },
            { stdin: "only these words\n", expected: "positional: only these words\nkeyword: (none)\n", hidden: true },
          ],
        },
        {
          title: "The mutable default, fixed",
          prompt: `The starter's \`collect(word, bag=[])\` is the classic bug: the default list is created once and shared. Each input line is a group of words; for each line the program calls \`collect\` for the first word **without** passing a bag, and for the following words passes the bag back in, then prints the bag. With the bug, the second line's bag still contains the first line's words. Fix the function with the \`None\` idiom so every line starts fresh — do not change the calling code.

**Input:** lines of words.
**Output:** one line per input line: the words collected, separated by spaces.

\`\`\`text
a b
c d
\`\`\`
prints
\`\`\`text
a b
c d
\`\`\``,
          starter: String.raw`import sys


def collect(word, bag=[]):
    # TODO: fix the shared default
    bag.append(word)
    return bag


for line in sys.stdin:
    words = line.split()
    if not words:
        continue
    bag = collect(words[0])
    for word in words[1:]:
        bag = collect(word, bag)
    print(" ".join(bag))
`,
          solution: String.raw`import sys


def collect(word, bag=None):
    if bag is None:
        bag = []
    bag.append(word)
    return bag


for line in sys.stdin:
    words = line.split()
    if not words:
        continue
    bag = collect(words[0])
    for word in words[1:]:
        bag = collect(word, bag)
    print(" ".join(bag))
`,
          hints: [
            "Default expressions run once, at `def` time — every call that omits `bag` gets the same list object.",
            "Use `bag=None` and create the list inside the function when it is `None`.",
          ],
          cases: [
            { stdin: "a b\nc d\n", expected: "a b\nc d\n" },
            { stdin: "x\ny\nz\n", expected: "x\ny\nz\n", hidden: true },
            { stdin: "one two three\nfour\n\nfive six\n", expected: "one two three\nfour\nfive six\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\ndef add(x, xs=[]):\n    xs.append(x)\n    return xs\n\nadd(1)\nprint(add(2))\n```",
          options: ["`[2]`", "`[1, 2]`", "`[[1], 2]`", "`TypeError`"],
          answer: 1,
          explanation: "The default list is created once when `def` runs and shared by every call that omits `xs`. The first call appended `1` to it; the second sees that same list.",
        },
        {
          prompt: "Which call is a `TypeError` for `def f(a, b=2, *, c=3)`?",
          options: ["`f(1)`", "`f(1, 5, c=6)`", "`f(1, 5, 6)`", "`f(a=1, c=0)`"],
          answer: 2,
          explanation: "Everything after the bare `*` is keyword-only, so a third positional argument is rejected. The other calls supply `a` and use defaults or keywords correctly.",
        },
        {
          prompt: "Inside `def f(*args, **kwargs)`, what are `args` and `kwargs`?",
          options: ["A list and a list", "A tuple and a dict", "A dict and a tuple", "Two tuples"],
          answer: 1,
          explanation: "Extra positional arguments are collected into a tuple; extra keyword arguments into a dict keyed by name. The names are conventional; the stars are the syntax.",
        },
        {
          prompt: "What is the difference between `max(xs)` and `max(*xs)` for `xs = [3, 1, 2]`?",
          options: [
            "None — both return 3",
            "`max(xs)` compares the elements; `max(*xs)` passes the list as a single argument",
            "`max(*xs)` is a `TypeError`",
            "`max(xs)` returns the list",
          ],
          answer: 0,
          explanation: "`max` accepts either one iterable or several positional values, and the star spreads the list into the latter form. They differ only on an empty list (`max([])` raises `ValueError`; `max(*[])` is `max()` with no arguments, a `TypeError`).",
        },
        {
          prompt: "Which signature order is valid?",
          options: ["`def f(a=1, b)`", "`def f(**kw, *args)`", "`def f(a, /, b, *, c)`", "`def f(*, a, /, b)`"],
          answer: 2,
          explanation: "Positional-only parameters come first, then `/`, then ordinary ones, then `*` and keyword-only ones, then `**kwargs`. A default before a non-default, `**kw` before `*args`, and `/` after `*` are all syntax errors.",
        },
      ],
    },
    {
      slug: "scope-and-closures",
      file: "03-scope-and-closures.md",
      exercises: [
        {
          title: "Counter factory",
          prompt: `Write \`make_counter(start, step)\` that returns a function with no parameters; each call returns the current value and then advances it by \`step\` — the state lives in the closure and is updated with \`nonlocal\`. Each input line creates its **own** counter and prints its first \`n\` values, showing that counters are independent.

**Input:** lines \`start step n\`.
**Output:** one line per input line with the \`n\` values, space-separated.

\`\`\`text
10 5 3
0 -1 4
\`\`\`
prints
\`\`\`text
10 15 20
0 -1 -2 -3
\`\`\``,
          starter: String.raw`import sys


def make_counter(start, step):
    # TODO: an inner function that returns the current value and advances it
    def step_fn():
        return 0
    return step_fn


for line in sys.stdin:
    start, step, n = map(int, line.split())
    counter = make_counter(start, step)
    print(" ".join(str(counter()) for _ in range(n)))
`,
          solution: String.raw`import sys


def make_counter(start, step):
    current = start

    def step_fn():
        nonlocal current
        value = current
        current += step
        return value
    return step_fn


for line in sys.stdin:
    start, step, n = map(int, line.split())
    counter = make_counter(start, step)
    print(" ".join(str(counter()) for _ in range(n)))
`,
          hints: [
            "Bind `current = start` in the outer function; the inner function reads and updates it.",
            "Without `nonlocal current`, the `+=` would make `current` a new local and fail with `UnboundLocalError`.",
            "Save the value to return before advancing.",
          ],
          cases: [
            { stdin: "10 5 3\n0 -1 4\n", expected: "10 15 20\n0 -1 -2 -3\n" },
            { stdin: "7 0 2\n", expected: "7 7\n", hidden: true },
            { stdin: "1 1 1\n1 1 1\n", expected: "1\n1\n", hidden: true },
          ],
        },
        {
          title: "Late binding, shown and fixed",
          prompt: `Build two lists of \`k\` adder functions in a loop over \`i\`: a **late-bound** list of \`lambda x: x + i\`, and a **bound** list that captures each \`i\` with a default argument (\`lambda x, i=i: x + i\`). Apply every function in each list to \`x\` and print both rows, so the bug and the fix are visible side by side.

**Input:** one line \`k x\` with \`k >= 1\`.
**Output:** \`bound: <results>\` then \`late: <results>\`.

\`\`\`text
3 10
\`\`\`
prints
\`\`\`text
bound: 10 11 12
late: 12 12 12
\`\`\``,
          starter: String.raw`k, x = map(int, input().split())
bound = []
late = []
for i in range(k):
    # TODO: append one adder to each list
    pass
print("bound:", " ".join(str(f(x)) for f in bound))
print("late:", " ".join(str(f(x)) for f in late))
`,
          solution: String.raw`k, x = map(int, input().split())
bound = []
late = []
for i in range(k):
    bound.append(lambda x, i=i: x + i)
    late.append(lambda x: x + i)
print("bound:", " ".join(str(f(x)) for f in bound))
print("late:", " ".join(str(f(x)) for f in late))
`,
          hints: [
            "The late-bound lambdas all read the same `i`, which is `k - 1` once the loop has finished.",
            "A default argument is evaluated when the lambda is created, so `i=i` freezes the current value.",
          ],
          cases: [
            { stdin: "3 10\n", expected: "bound: 10 11 12\nlate: 12 12 12\n" },
            { stdin: "1 5\n", expected: "bound: 5\nlate: 5\n", hidden: true },
            { stdin: "4 0\n", expected: "bound: 0 1 2 3\nlate: 3 3 3 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens?\n\n```python\ntotal = 0\n\ndef add(x):\n    total += x\n\nadd(5)\n```",
          options: ["`total` becomes 5", "`UnboundLocalError`", "`NameError`", "`SyntaxError`"],
          answer: 1,
          explanation: "`total += x` assigns `total`, which makes it local to `add` everywhere in the function; reading it before the assignment fails. `global total` would fix it; returning the new value is better.",
        },
        {
          prompt: "What does this print?\n\n```python\nfs = [lambda: i for i in range(3)]\nprint([f() for f in fs])\n```",
          options: ["`[0, 1, 2]`", "`[2, 2, 2]`", "`[3, 3, 3]`", "`[None, None, None]`"],
          answer: 1,
          explanation: "Each lambda closes over the variable `i`, not its value at creation; when called after the comprehension finished, `i` is 2. `lambda i=i: i` would bind each value.",
        },
        {
          prompt: "In what order are names looked up inside a function?",
          options: ["Global, local, enclosing, built-in", "Local, enclosing, global, built-in", "Built-in, global, enclosing, local", "Local, global, enclosing, built-in"],
          answer: 1,
          explanation: "LEGB: the innermost scope first, then enclosing function scopes, the module, and finally the built-ins. A local `list` therefore hides the built-in for that function.",
        },
        {
          prompt: "Which keyword lets an inner function rebind a variable of the enclosing function?",
          options: ["`global`", "`nonlocal`", "`outer`", "`static`"],
          answer: 1,
          explanation: "`nonlocal` targets the nearest enclosing function scope; `global` targets the module. The other two are not Python keywords.",
        },
        {
          prompt: "What does `make(2)(5)` return?\n\n```python\ndef make(n):\n    def f(x):\n        return x * n\n    return f\n```",
          options: ["`10`", "`7`", "A function", "`NameError` because `n` is gone"],
          answer: 0,
          explanation: "`make(2)` returns `f`, a closure that keeps `n` alive; calling it with 5 multiplies. The enclosing frame has returned but the captured variable lives in a cell.",
        },
      ],
    },
    {
      slug: "recursion",
      file: "04-recursion.md",
      exercises: [
        {
          title: "Flatten and measure",
          prompt: `Read one nested list literal (parse it with \`ast.literal_eval\`) and write two recursive functions: \`flatten(xs)\` returns every non-list element in order, and \`depth(xs)\` returns the nesting depth — \`[]\` and \`[1, 2]\` have depth 1, \`[[1]]\` has depth 2.

**Input:** one line holding a nested list of integers.
**Output:** \`flat: <elements space-separated>\` (or \`flat: (empty)\`), then \`depth: <d>\`.

\`\`\`text
[1, [2, [3, 4]], 5]
\`\`\`
prints
\`\`\`text
flat: 1 2 3 4 5
depth: 3
\`\`\``,
          starter: String.raw`import ast


def flatten(xs):
    # TODO: recurse into inner lists
    return []


def depth(xs):
    # TODO: 1 + the deepest inner list, or 1 if none
    return 1


data = ast.literal_eval(input())
flat = flatten(data)
print("flat:", " ".join(map(str, flat)) if flat else "(empty)")
print(f"depth: {depth(data)}")
`,
          solution: String.raw`import ast


def flatten(xs):
    out = []
    for x in xs:
        if isinstance(x, list):
            out.extend(flatten(x))
        else:
            out.append(x)
    return out


def depth(xs):
    inner = [depth(x) for x in xs if isinstance(x, list)]
    return 1 + max(inner, default=0)


data = ast.literal_eval(input())
flat = flatten(data)
print("flat:", " ".join(map(str, flat)) if flat else "(empty)")
print(f"depth: {depth(data)}")
`,
          hints: [
            "The base case is an element that is not a list; the recursive case extends with the flattened inner list.",
            "`max(..., default=0)` handles a list with no inner lists.",
          ],
          cases: [
            { stdin: "[1, [2, [3, 4]], 5]\n", expected: "flat: 1 2 3 4 5\ndepth: 3\n" },
            { stdin: "[]\n", expected: "flat: (empty)\ndepth: 1\n", hidden: true },
            { stdin: "[[[]]]\n", expected: "flat: (empty)\ndepth: 3\n", hidden: true },
            { stdin: "[1, 2, 3]\n", expected: "flat: 1 2 3\ndepth: 1\n", hidden: true },
          ],
        },
        {
          title: "Fibonacci with a cache",
          prompt: `Write the two-line recursive Fibonacci (\`fib(0) = 0\`, \`fib(1) = 1\`) and decorate it with \`functools.cache\` so that large arguments finish instantly. Read \`n\` queries and print each answer. Arguments go up to 500, so raise the recursion limit first.

**Input:** \`n\`, then \`n\` integers.
**Output:** one Fibonacci number per line.

\`\`\`text
3
10
50
90
\`\`\`
prints
\`\`\`text
55
12586269025
2880067194370816120
\`\`\``,
          starter: String.raw`import sys
from functools import cache

sys.setrecursionlimit(10_000)


# TODO: decorate and complete
def fib(n):
    return 0


n = int(input())
for _ in range(n):
    print(fib(int(input())))
`,
          solution: String.raw`import sys
from functools import cache

sys.setrecursionlimit(10_000)


@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


n = int(input())
for _ in range(n):
    print(fib(int(input())))
`,
          hints: [
            "`@cache` above the `def` memoises every result by argument.",
            "Without the cache `fib(90)` would make billions of calls; with it each value is computed once.",
          ],
          cases: [
            { stdin: "3\n10\n50\n90\n", expected: "55\n12586269025\n2880067194370816120\n" },
            { stdin: "2\n0\n1\n", expected: "0\n1\n", hidden: true },
            { stdin: "2\n300\n100\n", expected: "222232244629420445529739893461909967206666939096499764990979600\n354224848179261915075\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is wrong with this function?\n\n```python\ndef count_down(n):\n    print(n)\n    count_down(n - 1)\n```",
          options: ["Nothing", "It has no base case, so it recurses until `RecursionError`", "It should return `n`", "`print` cannot be used inside recursion"],
          answer: 1,
          explanation: "Nothing stops the recursion at 0; each call adds a frame until the interpreter's limit (1 000 by default) raises `RecursionError`.",
        },
        {
          prompt: "What does this print?\n\n```python\ndef show(n):\n    if n == 0:\n        return\n    show(n - 1)\n    print(n, end=\" \")\n\nshow(3)\n```",
          options: ["`3 2 1`", "`1 2 3`", "`0 1 2 3`", "Nothing"],
          answer: 1,
          explanation: "The print comes *after* the recursive call, so it runs during the unwind: the innermost call (n=1) prints first.",
        },
        {
          prompt: "Which requirement does `@functools.cache` place on the decorated function?",
          options: [
            "It must return an int",
            "Its arguments must be hashable and it should be pure (same inputs, same result)",
            "It must be recursive",
            "It must take exactly one argument",
          ],
          answer: 1,
          explanation: "The cache is a dict keyed by the arguments, so lists cannot be keys, and a cached result is only correct if the function has no side effects and depends only on its arguments.",
        },
        {
          prompt: "A correct recursion over a list of 5 000 elements, one element per call, raises `RecursionError`. What is the right fix?",
          options: [
            "Add a base case",
            "Rewrite as a loop or an explicit stack, or recurse on halves; raising the limit is the last resort",
            "Use `@cache`",
            "Convert the list to a tuple",
          ],
          answer: 1,
          explanation: "The recursion is correct but too deep for the default limit. `sys.setrecursionlimit` works on the judge but every frame costs memory; a loop, an explicit stack, or a log-depth divide-and-conquer removes the problem.",
        },
        {
          prompt: "Does CPython eliminate tail calls (`return f(n - 1)` reusing the frame)?",
          options: ["Yes, always", "No — every call adds a frame", "Only with `@cache`", "Only in functions without default arguments"],
          answer: 1,
          explanation: "Python deliberately keeps every frame for clear tracebacks. A tail-recursive function should be written as a `while` loop.",
        },
      ],
    },
    {
      slug: "lambdas-and-higher-order-functions",
      file: "05-lambdas-and-higher-order-functions.md",
      exercises: [
        {
          title: "Sort by several keys",
          prompt: `Read \`n\` records \`name score time\` and sort them by score **descending**, then by time **ascending**, then by name ascending, using a single \`sorted\` call with a key function returning a tuple. Then print the best record by the same ordering using \`min\` with the same key.

**Input:** \`n\`, then \`n\` lines.
**Output:** the sorted records as \`name score time\`, then \`best: <name>\`.

\`\`\`text
3
ada 90 12
bob 90 10
cy 80 5
\`\`\`
prints
\`\`\`text
bob 90 10
ada 90 12
cy 80 5
best: bob
\`\`\``,
          starter: String.raw`n = int(input())
records = []
for _ in range(n):
    name, score, time = input().split()
    records.append((name, int(score), int(time)))

# TODO: key = lambda r: (...)
ordered = records
for name, score, time in ordered:
    print(name, score, time)
# TODO: print the best
`,
          solution: String.raw`n = int(input())
records = []
for _ in range(n):
    name, score, time = input().split()
    records.append((name, int(score), int(time)))

key = lambda r: (-r[1], r[2], r[0])
ordered = sorted(records, key=key)
for name, score, time in ordered:
    print(name, score, time)
best = min(records, key=key)
print(f"best: {best[0]}")
`,
          hints: [
            "Negate the score inside the key tuple to get descending order for that field only.",
            "The same key works for `min`, because the first record in the sorted order has the smallest key.",
          ],
          cases: [
            { stdin: "3\nada 90 12\nbob 90 10\ncy 80 5\n", expected: "bob 90 10\nada 90 12\ncy 80 5\nbest: bob\n" },
            { stdin: "3\nzed 5 1\namy 5 1\nkim 5 1\n", expected: "amy 5 1\nkim 5 1\nzed 5 1\nbest: amy\n", hidden: true },
            { stdin: "1\nsolo 1 1\n", expected: "solo 1 1\nbest: solo\n", hidden: true },
          ],
        },
        {
          title: "A pipeline from partial",
          prompt: `The first line lists operations as \`name value\` pairs: \`add k\`, \`sub k\` (subtract \`k\`), \`mul k\`, \`pow k\`. Build each step as a \`functools.partial\` of the matching two-argument helper with \`k\` fixed, then apply the steps in order to every integer on the second line using \`map\` and print the results.

**Input:** a line of operation pairs (possibly empty), then a line of integers.
**Output:** the results, space-separated.

\`\`\`text
add 3 mul 2
1 2 3
\`\`\`
prints
\`\`\`text
8 10 12
\`\`\``,
          starter: String.raw`from functools import partial


def add(k, x):
    return x + k


def sub(k, x):
    return x - k


def mul(k, x):
    return x * k


def power(k, x):
    return x ** k


HELPERS = {"add": add, "sub": sub, "mul": mul, "pow": power}

tokens = input().split()
steps = []  # TODO: partial(HELPERS[name], int(value)) for each pair
nums = list(map(int, input().split()))


def run(x):
    # TODO: apply every step
    return x


print(*map(run, nums))
`,
          solution: String.raw`from functools import partial


def add(k, x):
    return x + k


def sub(k, x):
    return x - k


def mul(k, x):
    return x * k


def power(k, x):
    return x ** k


HELPERS = {"add": add, "sub": sub, "mul": mul, "pow": power}

tokens = input().split()
steps = [partial(HELPERS[tokens[i]], int(tokens[i + 1])) for i in range(0, len(tokens), 2)]
nums = list(map(int, input().split()))


def run(x):
    for step in steps:
        x = step(x)
    return x


print(*map(run, nums))
`,
          hints: [
            "The helpers take `k` first so `partial(helper, k)` leaves `x` as the one remaining argument.",
            "Walk the tokens two at a time with `range(0, len(tokens), 2)`.",
          ],
          cases: [
            { stdin: "add 3 mul 2\n1 2 3\n", expected: "8 10 12\n" },
            { stdin: "pow 2 sub 1\n0 1 2 3\n", expected: "-1 0 3 8\n", hidden: true },
            { stdin: "\n5 6\n", expected: "5 6\n", hidden: true },
            { stdin: "sub 10 mul -1\n4\n", expected: "6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `sorted([\"bb\", \"a\", \"ccc\"], key=len, reverse=True)` return?",
          options: ["`['ccc', 'bb', 'a']`", "`['a', 'bb', 'ccc']`", "`['ccc', 'a', 'bb']`", "`[3, 2, 1]`"],
          answer: 0,
          explanation: "The key maps each string to its length, the sort orders by that value, and `reverse=True` flips it. The elements themselves are returned, not the keys.",
        },
        {
          prompt: "Which is a valid lambda?",
          options: ["`lambda x: return x + 1`", "`lambda x: x + 1`", "`lambda x: if x: 1`", "`lambda: x = 1`"],
          answer: 1,
          explanation: "A lambda body is one expression; `return`, `if` statements and assignments are statements and not allowed. The conditional *expression* `1 if x else 0` would be fine.",
        },
        {
          prompt: "What does `list(map(str.upper, [\"a\", \"b\"]))` produce?",
          options: ["`['A', 'B']`", "`['a', 'b']`", "`TypeError`", "`<map object>`"],
          answer: 0,
          explanation: "`str.upper` is an unbound method taking the string as its argument, so `map` applies it to each element; `list` materialises the lazy result.",
        },
        {
          prompt: "What does `partial(pow, 2)(10)` compute?",
          options: ["`2 ** 10` = 1024", "`10 ** 2` = 100", "`pow(10, 2, 2)`", "`TypeError`"],
          answer: 0,
          explanation: "`partial` fixes the *first* positional argument, so the call becomes `pow(2, 10)`. To fix the exponent use `partial(pow, exp=…)` — which `pow` does not accept — or a helper with the parameters in the other order.",
        },
        {
          prompt: "Which key sorts a list of `(name, age)` pairs by age ascending and then name descending?",
          options: [
            "`key=lambda p: (p[1], p[0])` with `reverse=True`",
            "`key=lambda p: (p[1], -p[0])`",
            "Sort by name descending first, then a stable sort by age ascending",
            "`key=itemgetter(1, 0)`",
          ],
          answer: 2,
          explanation: "Strings cannot be negated, so a mixed-direction tuple key is impossible in one expression; two stable sorts, least significant first, achieve it. Options 1 and 4 give both keys the same direction.",
        },
        {
          prompt: "Why is `reduce` not a built-in?",
          options: [
            "It was removed for being slow",
            "Because `sum`, `min`, `max`, `any`, `all` and a plain loop cover the common folds more readably",
            "It cannot take a lambda",
            "It is a built-in — `functools` just re-exports it",
          ],
          answer: 1,
          explanation: "It lives in `functools` by design; a `for` loop with an accumulator is usually clearer than `reduce` with a lambda, and the named folds exist for the common cases.",
        },
      ],
    },
    {
      slug: "type-hints-and-docstrings",
      file: "06-type-hints-and-docstrings.md",
      exercises: [
        {
          title: "Inspect the contract",
          prompt: `Write \`mean(xs: list[float]) -> float\` with a one-line docstring, then print its result for the input **and** a report read from the function object itself: its \`__name__\`, the first line of its \`__doc__\`, and its annotations formatted from \`__annotations__\` (a class prints as its \`__name__\`; a generic like \`list[float]\` prints as its \`str\`).

**Input:** one line of numbers (at least one).
**Output:** \`mean <value>\` with two decimals, then \`name: mean\`, \`doc: <first docstring line>\`, \`param xs: list[float]\`, \`returns: float\`.

\`\`\`text
1 2 4
\`\`\`
prints
\`\`\`text
mean 2.33
name: mean
doc: Return the arithmetic mean of xs.
param xs: list[float]
returns: float
\`\`\``,
          starter: String.raw`def mean(xs):
    # TODO: add hints and the docstring "Return the arithmetic mean of xs."
    return 0.0


def hint_name(h):
    return h.__name__ if isinstance(h, type) else str(h)


values = [float(t) for t in input().split()]
print(f"mean {mean(values):.2f}")
# TODO: the report from mean.__name__, mean.__doc__, mean.__annotations__
`,
          solution: String.raw`def mean(xs: list[float]) -> float:
    """Return the arithmetic mean of xs."""
    return sum(xs) / len(xs)


def hint_name(h):
    return h.__name__ if isinstance(h, type) else str(h)


values = [float(t) for t in input().split()]
print(f"mean {mean(values):.2f}")
print(f"name: {mean.__name__}")
print(f"doc: {mean.__doc__.strip().splitlines()[0]}")
hints = dict(mean.__annotations__)
ret = hints.pop("return")
for param, hint in hints.items():
    print(f"param {param}: {hint_name(hint)}")
print(f"returns: {hint_name(ret)}")
`,
          hints: [
            "`__annotations__` is a dict with one entry per hinted parameter plus `'return'`.",
            "`float` is a class, so `hint_name` prints `float`; `list[float]` is a generic alias whose `str` is `list[float]`.",
          ],
          cases: [
            { stdin: "1 2 4\n", expected: "mean 2.33\nname: mean\ndoc: Return the arithmetic mean of xs.\nparam xs: list[float]\nreturns: float\n" },
            { stdin: "10\n", expected: "mean 10.00\nname: mean\ndoc: Return the arithmetic mean of xs.\nparam xs: list[float]\nreturns: float\n", hidden: true },
          ],
        },
        {
          title: "A checker driven by annotations",
          prompt: `Hints do nothing at run time — unless you make them. Three hinted functions are given: \`add(a: int, b: int)\`, \`repeat(s: str, n: int)\` and \`scale(x: float, k: float)\`. Write \`call(f, *args)\` that reads \`f.__annotations__\` and checks each argument with \`isinstance\` against its hint before calling (\`int\` is acceptable where \`float\` is hinted, as PEP 484 allows). Each input line is a function name followed by argument literals (parse them with \`ast.literal_eval\`).

**Input:** \`n\`, then \`n\` lines.
**Output:** \`ok <result>\` or \`type error: <param> expects <type>\` (the first failing parameter).

\`\`\`text
3
add 1 2
repeat "ab" 3
add 1 "x"
\`\`\`
prints
\`\`\`text
ok 3
ok ababab
type error: b expects int
\`\`\``,
          starter: String.raw`import ast


def add(a: int, b: int) -> int:
    return a + b


def repeat(s: str, n: int) -> str:
    return s * n


def scale(x: float, k: float) -> float:
    return x * k


FUNCTIONS = {"add": add, "repeat": repeat, "scale": scale}


def call(f, *args):
    # TODO: walk the parameters in f.__annotations__ (skipping "return"),
    #       check each argument with isinstance, and return either
    #       f"ok {result}" or f"type error: {param} expects {hint.__name__}"
    return f"ok {f(*args)}"


n = int(input())
for _ in range(n):
    name, *literals = input().split()
    args = [ast.literal_eval(tok) for tok in literals]
    print(call(FUNCTIONS[name], *args))
`,
          solution: String.raw`import ast


def add(a: int, b: int) -> int:
    return a + b


def repeat(s: str, n: int) -> str:
    return s * n


def scale(x: float, k: float) -> float:
    return x * k


FUNCTIONS = {"add": add, "repeat": repeat, "scale": scale}


def accepts(value, hint):
    if hint is float:
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return isinstance(value, hint)


def call(f, *args):
    params = [(p, h) for p, h in f.__annotations__.items() if p != "return"]
    for (param, hint), value in zip(params, args):
        if not accepts(value, hint):
            return f"type error: {param} expects {hint.__name__}"
    return f"ok {f(*args)}"


n = int(input())
for _ in range(n):
    name, *literals = input().split()
    args = [ast.literal_eval(tok) for tok in literals]
    print(call(FUNCTIONS[name], *args))
`,
          hints: [
            "`f.__annotations__` keeps the parameters in declaration order; drop the `'return'` key.",
            "`zip` the parameter list with the arguments and stop at the first `isinstance` failure.",
            "`hint.__name__` gives `int`, `str` or `float` for the message.",
          ],
          cases: [
            { stdin: "3\nadd 1 2\nrepeat \"ab\" 3\nadd 1 \"x\"\n", expected: "ok 3\nok ababab\ntype error: b expects int\n" },
            { stdin: "3\nscale 2 1.5\nscale \"2\" 1\nrepeat 3 \"ab\"\n", expected: "ok 3.0\ntype error: x expects float\ntype error: s expects str\n", hidden: true },
            { stdin: "2\nadd 2.0 1\nrepeat \"-\" 4\n", expected: "type error: a expects int\nok ----\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens when `def f(x: int) -> int: return x` is called as `f(\"a\")`?",
          options: ["`TypeError` from the hint", "Returns `\"a\"` — hints are not enforced at run time", "`ValueError`", "A warning is printed and `\"a\"` is returned"],
          answer: 1,
          explanation: "Annotations are stored and otherwise ignored by the interpreter. A checker such as mypy would flag the call; the running program does nothing special.",
        },
        {
          prompt: "Which hint is right for a parameter the function only iterates over?",
          options: ["`list[int]`", "`Iterable[int]` from `collections.abc`", "`Any`", "`tuple[int]`"],
          answer: 1,
          explanation: "Accept the widest type that works: an `Iterable` hint lets callers pass a list, tuple, set, generator or range. `list[int]` needlessly rejects the others; `Any` switches checking off.",
        },
        {
          prompt: "What does the hint `int | None` on a return type tell a caller?",
          options: [
            "The function returns an int, or raises",
            "The result may be `None` and must be checked before use",
            "The parameter is optional",
            "The function returns `None` on error and prints a message",
          ],
          answer: 1,
          explanation: "A union with `None` documents a lookup that can fail, and a type checker will insist on a `None` test before the value is used as an int. Optional *parameters* are those with defaults — a different thing.",
        },
        {
          prompt: "Where does `help(f)` get its text?",
          options: ["From the comments above the `def`", "From `f.__doc__`, the first-statement string of the body", "From `f.__annotations__`", "From the source file's header"],
          answer: 1,
          explanation: "The docstring is the string literal that is the first statement of the function body; comments are discarded by the compiler. `help` shows the signature (including hints) and the docstring.",
        },
        {
          prompt: "Which summary line follows PEP 257?",
          options: ["`\"\"\"returns the largest value\"\"\"`", "`\"\"\"Return the largest value in xs.\"\"\"`", "`\"\"\"This function will return the largest value.\"\"\"`", "`\"\"\"largest(xs) -> int\"\"\"`"],
          answer: 1,
          explanation: "Imperative mood, capitalised, ending in a full stop, describing the contract rather than restating the signature.",
        },
      ],
    },
    {
      slug: "functions-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Grid paths around obstacles",
          prompt: `Count the paths from the top-left cell to the bottom-right cell of a grid, moving only right or down and never entering a \`#\` cell. Write a recursive \`paths(r, c)\` memoised with \`functools.cache\`: the answer for a cell is the sum of the answers for the cell to its right and the cell below it, with the bottom-right cell counting 1 and any blocked or out-of-range cell counting 0.

**Input:** \`R C\`, then \`R\` lines of \`.\` and \`#\`.
**Output:** the number of paths.

\`\`\`text
3 3
...
.#.
...
\`\`\`
prints
\`\`\`text
2
\`\`\``,
          starter: String.raw`from functools import cache

R, C = map(int, input().split())
grid = [input() for _ in range(R)]


@cache
def paths(r, c):
    # TODO: out of range or blocked -> 0; bottom-right -> 1; else right + down
    return 0


print(paths(0, 0))
`,
          solution: String.raw`from functools import cache

R, C = map(int, input().split())
grid = [input() for _ in range(R)]


@cache
def paths(r, c):
    if r >= R or c >= C or grid[r][c] == "#":
        return 0
    if r == R - 1 and c == C - 1:
        return 1
    return paths(r + 1, c) + paths(r, c + 1)


print(paths(0, 0))
`,
          hints: [
            "Check the boundary and the obstacle first — that is the base case that returns 0.",
            "The bottom-right cell is the other base case; make sure it is tested *after* the blocked check.",
            "With `@cache` each cell is computed once, so the grid can be large.",
          ],
          cases: [
            { stdin: "3 3\n...\n.#.\n...\n", expected: "2\n" },
            { stdin: "2 2\n..\n..\n", expected: "2\n" },
            { stdin: "1 1\n.\n", expected: "1\n", hidden: true },
            { stdin: "2 2\n.#\n#.\n", expected: "0\n", hidden: true },
            { stdin: "3 7\n.......\n.......\n.......\n", expected: "28\n", hidden: true },
          ],
        },
        {
          title: "A keyword-only signature under test",
          prompt: `Define \`connect(host, port=80, *, secure=False)\` returning \`host=<host> port=<port> secure=<secure>\`. Then read \`n\` call expressions written as Python source, evaluate each with \`eval\` in a \`try\`, and print the result — or \`TypeError\` when the call does not fit the signature (too many positional arguments, a missing \`host\`, an unknown keyword).

**Input:** \`n\`, then \`n\` call expressions.
**Output:** one line per call.

\`\`\`text
3
connect("db")
connect("db", 443, secure=True)
connect("db", 1, True)
\`\`\`
prints
\`\`\`text
host=db port=80 secure=False
host=db port=443 secure=True
TypeError
\`\`\``,
          starter: String.raw`# TODO: def connect(host, port=80, *, secure=False)


n = int(input())
for _ in range(n):
    expr = input()
    # TODO: try eval(expr) / except TypeError
`,
          solution: String.raw`def connect(host, port=80, *, secure=False):
    return f"host={host} port={port} secure={secure}"


n = int(input())
for _ in range(n):
    expr = input()
    try:
        print(eval(expr))
    except TypeError:
        print("TypeError")
`,
          hints: [
            "The bare `*` makes `secure` keyword-only, so a third positional argument is a `TypeError`.",
            "Catch `TypeError` only — that is what a bad call raises.",
          ],
          cases: [
            { stdin: "3\nconnect(\"db\")\nconnect(\"db\", 443, secure=True)\nconnect(\"db\", 1, True)\n", expected: "host=db port=80 secure=False\nhost=db port=443 secure=True\nTypeError\n" },
            { stdin: "3\nconnect(port=8080, host=\"x\")\nconnect()\nconnect(\"a\", timeout=3)\n", expected: "host=x port=8080 secure=False\nTypeError\nTypeError\n", hidden: true },
            { stdin: "2\nconnect(\"h\", secure=True)\nconnect(\"h\", port=1)\n", expected: "host=h port=80 secure=True\nhost=h port=1 secure=False\n", hidden: true },
          ],
        },
        {
          title: "Compose",
          prompt: `Build a pipeline of closures. The first line lists steps: \`add k\`, \`mul k\` and \`clamp lo hi\`; write a factory for each (\`make_add(k)\`, \`make_mul(k)\`, \`make_clamp(lo, hi)\`) that returns a one-argument function. Compose all the steps into a **single** function with \`functools.reduce\` and a \`compose(f, g)\` helper, then apply it to every integer on the second line.

**Input:** a line of steps (possibly empty), then a line of integers.
**Output:** the results, space-separated.

\`\`\`text
add 1 mul 3 clamp 0 10
-5 0 2 5
\`\`\`
prints
\`\`\`text
0 3 9 10
\`\`\``,
          starter: String.raw`from functools import reduce


def make_add(k):
    return lambda x: x + k


def make_mul(k):
    # TODO
    return lambda x: x


def make_clamp(lo, hi):
    # TODO
    return lambda x: x


def compose(f, g):
    # TODO: the function that applies f, then g
    return f


tokens = input().split()
steps = []
i = 0
while i < len(tokens):
    if tokens[i] == "clamp":
        steps.append(make_clamp(int(tokens[i + 1]), int(tokens[i + 2])))
        i += 3
    else:
        factory = {"add": make_add, "mul": make_mul}[tokens[i]]
        steps.append(factory(int(tokens[i + 1])))
        i += 2

pipeline = reduce(compose, steps, lambda x: x)
print(*(pipeline(int(t)) for t in input().split()))
`,
          solution: String.raw`from functools import reduce


def make_add(k):
    return lambda x: x + k


def make_mul(k):
    return lambda x: x * k


def make_clamp(lo, hi):
    return lambda x: max(lo, min(hi, x))


def compose(f, g):
    return lambda x: g(f(x))


tokens = input().split()
steps = []
i = 0
while i < len(tokens):
    if tokens[i] == "clamp":
        steps.append(make_clamp(int(tokens[i + 1]), int(tokens[i + 2])))
        i += 3
    else:
        factory = {"add": make_add, "mul": make_mul}[tokens[i]]
        steps.append(factory(int(tokens[i + 1])))
        i += 2

pipeline = reduce(compose, steps, lambda x: x)
print(*(pipeline(int(t)) for t in input().split()))
`,
          hints: [
            "Each factory returns a lambda that closes over its parameters — a fresh closure per call.",
            "`compose(f, g)` must apply `f` first, so that folding left keeps the steps in input order.",
            "The identity `lambda x: x` is the initial value for `reduce`, so an empty step list works.",
          ],
          cases: [
            { stdin: "add 1 mul 3 clamp 0 10\n-5 0 2 5\n", expected: "0 3 9 10\n" },
            { stdin: "clamp -1 1\n-5 0 5\n", expected: "-1 0 1\n", hidden: true },
            { stdin: "mul 2 add -3\n4\n", expected: "5\n", hidden: true },
            { stdin: "\n7 8\n", expected: "7 8\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\ndef f():\n    return\n\nprint(f() is None)\n```",
          options: ["`True`", "`False`", "`None`", "`SyntaxError`"],
          answer: 0,
          explanation: "A bare `return` returns `None`, the same as falling off the end. Comparing with `is None` gives `True`.",
        },
        {
          prompt: "Which default is safe?",
          options: ["`def f(xs=[])`", "`def f(xs={})`", "`def f(xs=None)` then `xs = [] if xs is None else xs`", "`def f(xs=list())`"],
          answer: 2,
          explanation: "Any expression in the default is evaluated once at `def` time — `list()` no less than `[]`. The `None` sentinel with creation inside the body gives each call a fresh object.",
        },
        {
          prompt: "What does `print(*[1, 2], *[3])` print?",
          options: ["`[1, 2] [3]`", "`1 2 3`", "`(1, 2, 3)`", "`TypeError`"],
          answer: 1,
          explanation: "Each star spreads its list into separate positional arguments, so `print` receives 1, 2, 3.",
        },
        {
          prompt: "What does this print?\n\n```python\nx = 1\ndef f():\n    print(x)\n    x = 2\nf()\n```",
          options: ["`1`", "`2`", "`UnboundLocalError`", "`None`"],
          answer: 2,
          explanation: "The assignment on the second line makes `x` local to the whole function, so the `print` on the first line reads a local that has no value yet.",
        },
        {
          prompt: "Which fix makes the lambdas capture each `i`?\n\n```python\nfs = [lambda: i for i in range(3)]\n```",
          options: ["`[lambda: i for i in range(3)][::-1]`", "`[lambda i=i: i for i in range(3)]`", "`[lambda: int(i) for i in range(3)]`", "`[lambda: i.copy() for i in range(3)]`"],
          answer: 1,
          explanation: "A default argument is evaluated when the lambda is created, binding the current value. Reversing, converting or copying inside the body still reads `i` late.",
        },
        {
          prompt: "What does `@functools.cache` change about `fib(n)`?",
          options: ["It makes the recursion iterative", "It stores each result so repeated arguments return instantly — exponential becomes linear", "It raises the recursion limit", "It converts the result to a float"],
          answer: 1,
          explanation: "The decorator wraps the function with a dictionary keyed by arguments; the call tree collapses because every sub-problem is solved once.",
        },
        {
          prompt: "What is `sorted([(1, \"b\"), (1, \"a\"), (0, \"z\")], key=lambda p: (-p[0], p[1]))`?",
          options: ["`[(1, 'a'), (1, 'b'), (0, 'z')]`", "`[(0, 'z'), (1, 'a'), (1, 'b')]`", "`[(1, 'b'), (1, 'a'), (0, 'z')]`", "`TypeError`"],
          answer: 0,
          explanation: "The negated first component sorts descending; ties are broken by the string ascending. Tuples compare element by element.",
        },
        {
          prompt: "What does `list(filter(None, [0, 1, \"\", \"a\", None, []]))` produce?",
          options: ["`[1, 'a']`", "`[0, '', None, []]`", "`[]`", "`TypeError`"],
          answer: 0,
          explanation: "`filter(None, ...)` keeps the truthy elements. Zero, the empty string, `None` and the empty list are falsy and dropped.",
        },
        {
          prompt: "What is `f.__annotations__` for `def f(a: int, b) -> str`?",
          options: ["`{'a': int, 'b': None, 'return': str}`", "`{'a': int, 'return': str}`", "`{'a': 'int', 'return': 'str'}`", "`{'return': str}`"],
          answer: 1,
          explanation: "Only annotated parameters appear; `b` has no entry. The values are the objects themselves (the classes), not strings, unless `from __future__ import annotations` is in effect.",
        },
        {
          prompt: "Which statement about `nonlocal` is correct?",
          options: [
            "It refers to a module-level name",
            "It lets an inner function rebind a name in an enclosing *function* scope, which must already exist",
            "It creates the variable if it does not exist",
            "It is required to *read* an enclosing variable",
          ],
          answer: 1,
          explanation: "Reading needs nothing; rebinding needs `nonlocal`, and the name must be bound in an enclosing function (not the module — that is `global`).",
        },
        {
          prompt: "What does `make_counter` return, and what does calling the result twice give?\n\n```python\ndef make_counter():\n    n = 0\n    def step():\n        nonlocal n\n        n += 1\n        return n\n    return step\n```",
          options: ["It returns 1; calling it is a `TypeError`", "A function; calling it twice gives 1 then 2", "A function; calling it twice gives 1 then 1", "`None`"],
          answer: 1,
          explanation: "The closure keeps `n` in a cell and `nonlocal` lets `step` update it, so each call continues from the previous value.",
        },
        {
          prompt: "A function's docstring is the string on its *second* line, after a comment on the first. Is it stored in `__doc__`?",
          options: ["No — the comment breaks it", "Yes — comments are not statements, so the string is still the first statement", "Only if it uses triple quotes", "Only in Python 3.12+"],
          answer: 1,
          explanation: "The compiler discards comments entirely; the string literal remains the first statement of the body and becomes the docstring. Any quote style works, though triple double quotes are the convention.",
        },
      ],
    },
  ],
});
