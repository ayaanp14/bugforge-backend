import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "memory-and-performance",
  title: "Memory, performance and the interpreter",
  blurb: "The object model with reference counting and the cycle collector; the cost model of the built-in operations; bytecode, code objects and the 3.11 specialising interpreter; measuring with timeit, cProfile and tracemalloc; numeric performance with array, bytes and NumPy; and the checklist for writing fast Python.",
  icon: "clock",
  overview: `Python is fast enough for most programs and slow in ways that are entirely predictable once you know three things: every value is a heap object with a reference count, every built-in operation has a fixed cost, and the interpreter executes one bytecode instruction at a time with no compiler to save you from a quadratic loop. This module makes those three things visible — the object header and the collector, the table of costs, the bytecode behind a line — and then turns them into practice: measuring before optimising, moving numeric work into unboxed arrays, and a checklist that starts with the algorithm and ends with the hot loop.

The object model covers what objects cost, references versus values, reference counting, cycles and the generational collector, weak references and the memory levers. The cost model gives the table of list, dict, set, string and deque costs, the loop shapes that hide a quadratic, and the hidden costs of copying, hashing and calls. Bytecode and the interpreter covers code objects, reading \`dis\`, the four kinds of load, frames, constant folding and the 3.11 specialiser. Measuring covers \`perf_counter\`, \`timeit\`, \`cProfile\`, \`tracemalloc\` and benchmarking hygiene. Numeric performance covers \`array\`, \`bytes\`, \`memoryview\` and NumPy vectorisation. Writing fast Python is the ordered checklist.

The exercises are whole programs: a reference-count simulator and a cycle-collector simulator, a sliding-window maximum and a membership test sized so that only the right data structure finishes in time, a code-object inspector and a name classifier, a profile-table reader and a stopwatch with an injected clock, vectorised statistics and byte checksums, memoised grid paths and prefix-sum range queries. The checkpoint adds top-k with a heap, order-preserving de-duplication at scale, and a frequency tally with stable ties.`,
  lessons: [
    {
      slug: "the-object-model",
      file: "01-the-object-model.md",
      exercises: [
        {
          title: "Reference counting by hand",
          prompt: `Simulate CPython's reference counting. Read commands until EOF: \`new <var> <obj>\` binds a variable to an object (creating the object if it is not live); \`alias <var2> <var1>\` binds \`var2\` to whatever \`var1\` refers to; \`del <var>\` unbinds. Rebinding or deleting a variable drops one reference from its old object, and when an object's count reaches zero print \`freed <obj>\` immediately. After the commands print \`live <obj>=<count>\` for every live object sorted by name, or \`live none\`.

**Input:** one command per line.
**Output:** freed lines as they happen, then the live objects.

\`\`\`text
new a O1
alias b a
del a
new b O2
new c O2
\`\`\`
prints
\`\`\`text
freed O1
live O2=2
\`\`\``,
          starter: String.raw`import sys

bindings = {}   # variable -> object name
counts = {}     # object name -> reference count


def release(var):
    """Drop the reference held by var, freeing the object at zero."""
    # TODO
    pass


def bind(var, obj):
    # TODO: release the old binding, then bind and count
    pass


for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    # TODO: dispatch new / alias / del

# TODO: live report
`,
          solution: String.raw`import sys

bindings = {}   # variable -> object name
counts = {}     # object name -> reference count


def release(var):
    """Drop the reference held by var, freeing the object at zero."""
    obj = bindings.pop(var, None)
    if obj is None:
        return
    counts[obj] -= 1
    if counts[obj] == 0:
        del counts[obj]
        print("freed", obj)


def bind(var, obj):
    release(var)
    bindings[var] = obj
    counts[obj] = counts.get(obj, 0) + 1


for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    command = parts[0]
    if command == "new":
        bind(parts[1], parts[2])
    elif command == "alias":
        bind(parts[1], bindings[parts[2]])
    elif command == "del":
        release(parts[1])

if counts:
    for obj in sorted(counts):
        print(f"live {obj}={counts[obj]}")
else:
    print("live none")
`,
          hints: [
            "Two tables: which object each variable holds, and how many holders each object has.",
            "Rebinding is a release followed by a bind — exactly what CPython does when a name is reassigned.",
          ],
          cases: [
            { stdin: "new a O1\nalias b a\ndel a\nnew b O2\nnew c O2\n", expected: "freed O1\nlive O2=2\n" },
            { stdin: "new a O1\ndel a\n", expected: "freed O1\nlive none\n", hidden: true },
            { stdin: "new a O1\nalias b a\nalias c b\ndel a\ndel b\nnew c O3\n", expected: "freed O1\nlive O3=1\n", hidden: true },
          ],
        },
        {
          title: "The cycle collector by hand",
          prompt: `Simulate why reference counting needs a cycle collector. Read commands until EOF: \`var <name> <obj>\` binds a variable to an object, \`ref <obj1> <obj2>\` makes \`obj1\` hold a reference to \`obj2\`, and \`del <name>\` unbinds a variable. An object's refcount is the number of variables bound to it plus the number of \`ref\` edges into it; an object is *reachable* if some bound variable reaches it through \`ref\` edges. Print \`<obj> refcount=<n> <reachable|garbage>\` for every object mentioned, sorted by name, then \`collected <number of garbage objects>\`.

**Input:** one command per line.
**Output:** one line per object, then the count.

\`\`\`text
var a O1
var b O2
ref O1 O2
ref O2 O1
del a
del b
\`\`\`
prints
\`\`\`text
O1 refcount=1 garbage
O2 refcount=1 garbage
collected 2
\`\`\``,
          starter: String.raw`import sys
from collections import defaultdict

bindings = {}                 # variable -> object
edges = defaultdict(list)     # object -> objects it references
objects = set()

for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    # TODO: var / ref / del, recording every object seen


def reachable():
    # TODO: depth-first from the bound variables
    return set()


# TODO: refcounts and the report
`,
          solution: String.raw`import sys
from collections import defaultdict

bindings = {}                 # variable -> object
edges = defaultdict(list)     # object -> objects it references
objects = set()

for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    if parts[0] == "var":
        bindings[parts[1]] = parts[2]
        objects.add(parts[2])
    elif parts[0] == "ref":
        edges[parts[1]].append(parts[2])
        objects.update(parts[1:3])
    elif parts[0] == "del":
        bindings.pop(parts[1], None)


def reachable():
    seen = set()
    stack = list(bindings.values())
    while stack:
        obj = stack.pop()
        if obj in seen:
            continue
        seen.add(obj)
        stack.extend(edges[obj])
    return seen


alive = reachable()
counts = {obj: 0 for obj in objects}
for obj in bindings.values():
    counts[obj] += 1
for targets in edges.values():
    for target in targets:
        counts[target] += 1

garbage = 0
for obj in sorted(objects):
    status = "reachable" if obj in alive else "garbage"
    garbage += status == "garbage"
    print(f"{obj} refcount={counts[obj]} {status}")
print("collected", garbage)
`,
          hints: [
            "Refcount is a sum of two things — variables and incoming edges — and says nothing about reachability.",
            "Reachability is a graph walk from the roots (the bound variables); a cycle with no root has positive refcounts and is still garbage.",
          ],
          cases: [
            { stdin: "var a O1\nvar b O2\nref O1 O2\nref O2 O1\ndel a\ndel b\n", expected: "O1 refcount=1 garbage\nO2 refcount=1 garbage\ncollected 2\n" },
            { stdin: "var a O1\nref O1 O2\nref O2 O1\n", expected: "O1 refcount=2 reachable\nO2 refcount=1 reachable\ncollected 0\n", hidden: true },
            { stdin: "var a O1\nvar b O1\nref O1 O2\ndel a\nvar c O3\ndel c\n", expected: "O1 refcount=1 reachable\nO2 refcount=1 reachable\nO3 refcount=0 garbage\ncollected 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `del x` do?",
          options: ["Frees the object immediately", "Removes the name `x`, dropping one reference; the object is freed only if that was the last", "Marks the object for the collector", "Nothing"],
          answer: 1,
          explanation: "Reference counting frees at zero; another name or container slot keeps the object alive.",
        },
        {
          prompt: "Why is `x is 5` wrong even though it often works?",
          options: ["`is` cannot compare ints", "It depends on the small-int cache; identity is not value", "5 is not an object", "It raises"],
          answer: 1,
          explanation: "`==` is value; `is` is identity, correct for singletons like `None`.",
        },
        {
          prompt: "Why can reference counting alone not free `a → b → a` after `del a, b`?",
          options: ["Lists are never freed", "Each object still holds a reference to the other, so neither count reaches zero", "`del` is lazy", "They are interned"],
          answer: 1,
          explanation: "The generational cycle collector finds unreachable cycles and frees them.",
        },
        {
          prompt: "What does `__slots__` change?",
          options: ["Nothing at run time", "Instances store attributes in fixed slots instead of a per-instance dict: less memory, faster access, no ad-hoc attributes", "Makes the class immutable", "Enables weak references"],
          answer: 1,
          explanation: "Roughly 48 bytes per instance instead of ~150 for a small object.",
        },
        {
          prompt: "What is a `weakref.ref(obj)` for?",
          options: ["A faster reference", "Referring to an object without keeping it alive — caches and registries", "A copy", "Thread safety"],
          answer: 1,
          explanation: "When the strong references go, the weak reference returns `None`.",
        },
      ],
    },
    {
      slug: "the-cost-model",
      file: "02-the-cost-model.md",
      exercises: [
        {
          title: "Sliding window maximum",
          prompt: `Read \`n k seed\`. Generate \`xs = [rng.randrange(1_000_000) for _ in range(n)]\` with \`rng = random.Random(seed)\`. Compute the maximum of every window of \`k\` consecutive values in O(n) with a monotonic \`collections.deque\` of indices — the naive O(n·k) scan will not finish the hidden case. Print \`windows <n - k + 1>\`, \`first <maximum of the first window>\`, \`last <maximum of the last window>\` and \`sum <sum of all window maxima>\`.

**Input:** \`n k seed\`.
**Output:** four lines.

\`\`\`text
8 3 1
\`\`\`
prints
\`\`\`text
windows 6
first 888598
last 267459
sum 4575363
\`\`\``,
          starter: String.raw`import random
from collections import deque

n, k, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(1_000_000) for _ in range(n)]


def window_maxima(values, k):
    """Yield the maximum of each window of size k, in O(n)."""
    # TODO: deque of indices, front is the maximum of the current window
    yield from ()


maxima = list(window_maxima(xs, k))
print("windows", len(maxima))
print("first", maxima[0])
print("last", maxima[-1])
print("sum", sum(maxima))
`,
          solution: String.raw`import random
from collections import deque

n, k, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(1_000_000) for _ in range(n)]


def window_maxima(values, k):
    """Yield the maximum of each window of size k, in O(n)."""
    window = deque()
    for i, value in enumerate(values):
        while window and values[window[-1]] <= value:
            window.pop()
        window.append(i)
        if window[0] <= i - k:
            window.popleft()
        if i >= k - 1:
            yield values[window[0]]


maxima = list(window_maxima(xs, k))
print("windows", len(maxima))
print("first", maxima[0])
print("last", maxima[-1])
print("sum", sum(maxima))
`,
          hints: [
            "Keep indices whose values are decreasing from front to back; a new value evicts everything smaller from the back.",
            "The front index is the window maximum; drop it when it falls out of the window (`window[0] <= i - k`).",
          ],
          cases: [
            { stdin: "8 3 1\n", expected: "windows 6\nfirst 888598\nlast 267459\nsum 4575363\n" },
            { stdin: "200000 1000 7\n", expected: "windows 199001\nfirst 999395\nlast 999700\nsum 198817194568\n", hidden: true },
            { stdin: "50000 50000 3\n", expected: "windows 1\nfirst 999987\nlast 999987\nsum 999987\n", hidden: true },
            { stdin: "10 1 5\n", expected: "windows 10\nfirst 653159\nlast 683704\nsum 6962749\n", hidden: true },
          ],
        },
        {
          title: "Membership at scale",
          prompt: `Read \`n m seed\`. With \`rng = random.Random(seed)\`, generate \`items = [rng.randrange(10**5) for _ in range(n)]\` and then \`queries = [rng.randrange(10**5) for _ in range(m)]\` (in that order). Print \`distinct <number of distinct items>\` and \`hits <number of queries that occur among the items>\`. A list membership test per query is O(n·m) and will time out on the hidden case; build a set.

**Input:** \`n m seed\`.
**Output:** two lines.

\`\`\`text
2000 2000 1
\`\`\`
prints
\`\`\`text
distinct 1980
hits 44
\`\`\``,
          starter: String.raw`import random

n, m, seed = map(int, input().split())
rng = random.Random(seed)
items = [rng.randrange(10**5) for _ in range(n)]
queries = [rng.randrange(10**5) for _ in range(m)]

# TODO: distinct and hits with a set
`,
          solution: String.raw`import random

n, m, seed = map(int, input().split())
rng = random.Random(seed)
items = [rng.randrange(10**5) for _ in range(n)]
queries = [rng.randrange(10**5) for _ in range(m)]

present = set(items)
print("distinct", len(present))
print("hits", sum(q in present for q in queries))
`,
          hints: [
            "`set(items)` is one O(n) pass; every `in` afterwards is O(1) average.",
            "`sum(q in present for q in queries)` counts `True` values — a C-speed loop over the generator.",
          ],
          cases: [
            { stdin: "2000 2000 1\n", expected: "distinct 1980\nhits 44\n" },
            { stdin: "100000 100000 11\n", expected: "distinct 63261\nhits 63373\n", hidden: true },
            { stdin: "1 1 2\n", expected: "distinct 1\nhits 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the cost of `lst.pop(0)` on a list of n items?",
          options: ["O(1)", "O(n) — every remaining element shifts", "O(log n)", "O(n log n)"],
          answer: 1,
          explanation: "`deque.popleft()` is O(1); a list is an array.",
        },
        {
          prompt: "Which loop is quadratic?",
          options: ["`for x in xs: seen.add(x)`", "`for x in xs: if x not in result_list: result_list.append(x)`", "`for x in xs: total += x`", "`for x in sorted(xs): ...`"],
          answer: 1,
          explanation: "A linear `in` on a list inside a linear loop over the same data.",
        },
        {
          prompt: "How should a string be built from ten thousand pieces?",
          options: ["`s += piece` in a loop", "`\"\".join(pieces)`", "`s = s + piece`", "`str(pieces)`"],
          answer: 1,
          explanation: "One allocation and one pass; repeated concatenation may copy the whole string each time.",
        },
        {
          prompt: "What is the cost of `heapq.nlargest(k, xs)` and why prefer it over `sorted(xs)[-k:]`?",
          options: ["O(n log n); no reason", "O(n log k) — much cheaper when k is small", "O(k)", "O(n²)"],
          answer: 1,
          explanation: "A heap of size k over n items; sorting does far more work for the top three.",
        },
        {
          prompt: "Roughly how many simple Python-level loop iterations run in a second?",
          options: ["About a thousand", "About ten million", "About a billion", "Unbounded"],
          answer: 1,
          explanation: "~50–100 ns per iteration; 10⁸ iterations will not finish under a one-second limit unless the loop runs in C.",
        },
      ],
    },
    {
      slug: "bytecode-and-the-interpreter",
      file: "03-bytecode-and-the-interpreter.md",
      exercises: [
        {
          title: "Inspect a code object",
          prompt: `Read Python source from standard input that defines a function \`f\`. Compile it with \`compile(src, "<src>", "exec")\`, run it with \`exec\` into a fresh namespace, take \`f.__code__\`, and print four lines: \`names <co_names joined by ", ">\`, \`varnames <co_varnames joined>\`, \`argcount <co_argcount>\` and \`consts <co_consts joined>\` where each constant is shown by \`repr\` except nested code objects, shown as \`<code NAME>\`. An empty tuple prints as \`-\`.

**Input:** the source.
**Output:** four lines.

\`\`\`text
def f(a, b):
    total = a + b * 2
    return total
\`\`\`
prints
\`\`\`text
names -
varnames a, b, total
argcount 2
consts None, 2
\`\`\``,
          starter: String.raw`import sys
import types

src = sys.stdin.read()
namespace = {}
exec(compile(src, "<src>", "exec"), namespace)
code = namespace["f"].__code__


def show(value):
    # TODO: '<code NAME>' for a code object, else repr
    return repr(value)


def joined(items):
    return ", ".join(items) if items else "-"


# TODO: the four lines
`,
          solution: String.raw`import sys
import types

src = sys.stdin.read()
namespace = {}
exec(compile(src, "<src>", "exec"), namespace)
code = namespace["f"].__code__


def show(value):
    if isinstance(value, types.CodeType):
        return f"<code {value.co_name}>"
    return repr(value)


def joined(items):
    return ", ".join(items) if items else "-"


print("names", joined(code.co_names))
print("varnames", joined(code.co_varnames))
print("argcount", code.co_argcount)
print("consts", joined(show(c) for c in code.co_consts))
`,
          hints: [
            "`exec` of the compiled module code defines `f` in the namespace dict you pass; its `__code__` is the code object.",
            "`isinstance(value, types.CodeType)` identifies a nested comprehension or function; everything else has a stable `repr`.",
          ],
          cases: [
            { stdin: "def f(a, b):\n    total = a + b * 2\n    return total\n", expected: "names -\nvarnames a, b, total\nargcount 2\nconsts None, 2\n" },
            { stdin: "def f(xs):\n    limit = 2 * 60 * 60\n    return [x for x in xs if x < limit]\n", expected: "names -\nvarnames xs\nargcount 1\nconsts None, 7200, <code <listcomp>>\n", hidden: true },
            { stdin: "def f(items):\n    out = []\n    for item in items:\n        out.append(str(item))\n    return out\n", expected: "names append, str\nvarnames items, out, item\nargcount 1\nconsts None\n", hidden: true },
          ],
        },
        {
          title: "Classify the names",
          prompt: `Read Python source that defines a function \`f\`, compile and run it as before. Using \`f.__code__\` and \`dis.get_instructions(f)\`, print \`locals <co_varnames joined by ", ">\`, \`globals <sorted distinct names loaded by LOAD_GLOBAL>\` and \`attributes <sorted names in co_names that are not globals>\` — an empty group prints \`-\`. Whether a name is a local, a global or an attribute is decided by the compiler and is the same in every version, unlike instruction counts.

**Input:** the source.
**Output:** three lines.

\`\`\`text
def f(items):
    out = []
    for item in items:
        out.append(len(str(item)))
    return out
\`\`\`
prints
\`\`\`text
locals items, out, item
globals len, str
attributes append
\`\`\``,
          starter: String.raw`import dis
import sys

src = sys.stdin.read()
namespace = {}
exec(compile(src, "<src>", "exec"), namespace)
f = namespace["f"]


def joined(names):
    return ", ".join(names) if names else "-"


# TODO: locals from co_varnames, globals from the LOAD_GLOBAL instructions, attributes = the rest of co_names
`,
          solution: String.raw`import dis
import sys

src = sys.stdin.read()
namespace = {}
exec(compile(src, "<src>", "exec"), namespace)
f = namespace["f"]


def joined(names):
    return ", ".join(names) if names else "-"


code = f.__code__
global_names = {ins.argval for ins in dis.get_instructions(f) if ins.opname == "LOAD_GLOBAL"}
attribute_names = sorted(name for name in code.co_names if name not in global_names)

print("locals", joined(code.co_varnames))
print("globals", joined(sorted(global_names)))
print("attributes", joined(attribute_names))
`,
          hints: [
            "`co_names` holds every global *and* attribute name the function uses; the instructions tell you which are loaded as globals.",
            "A name in `co_varnames` is a slot read; a global is a dict lookup per use; an attribute name is a lookup on an object.",
          ],
          cases: [
            { stdin: "def f(items):\n    out = []\n    for item in items:\n        out.append(len(str(item)))\n    return out\n", expected: "locals items, out, item\nglobals len, str\nattributes append\n" },
            { stdin: "def f(xs):\n    total = 0\n    for x in xs:\n        total += x\n    return total\n", expected: "locals xs, total, x\nglobals -\nattributes -\n", hidden: true },
            { stdin: "def f(point):\n    return math.hypot(point.x, point.y)\n", expected: "locals point\nglobals math\nattributes hypot, x, y\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `LOAD_FAST` do?",
          options: ["A dict lookup in globals", "Reads a local variable from the frame's slot array by index", "Loads a constant", "Calls a function"],
          answer: 1,
          explanation: "That is why locals are cheaper than globals (`LOAD_GLOBAL` is a dict lookup, cached or not).",
        },
        {
          prompt: "What does the compiler do with `x = 2 * 60 * 60`?",
          options: ["Emits two multiplications", "Folds it to the constant 7200", "Raises", "Defers it"],
          answer: 1,
          explanation: "Constant folding is one of the few optimisations the compiler performs; it hoists and inlines nothing.",
        },
        {
          prompt: "What does 3.11's specialising interpreter do?",
          options: ["Compiles to machine code", "Rewrites generic instructions into type-specialised versions with inline caches once types prove stable", "Removes the GIL", "Parallelises loops"],
          answer: 1,
          explanation: "`BINARY_OP` on two ints becomes `BINARY_OP_ADD_INT`; mixed types in a hot loop de-specialise.",
        },
        {
          prompt: "What does a `try` block cost in 3.11 when nothing is raised?",
          options: ["A stack push per entry", "Nothing — handlers are found from a table only when an exception occurs", "A function call", "A dict lookup"],
          answer: 1,
          explanation: "Zero-cost exceptions make `try/except` the right idiom for the rare failing case.",
        },
        {
          prompt: "Why must a program never print `dis` output or instruction counts as its answer?",
          options: ["`dis` is slow", "The instruction set changes between minor versions, so the output is not portable", "It is disallowed", "It prints to stderr"],
          answer: 1,
          explanation: "Bytecode is a per-version diagnostic; code-object names and constants are stable, instruction sets are not.",
        },
      ],
    },
    {
      slug: "measuring",
      file: "04-measuring.md",
      exercises: [
        {
          title: "Read a profile",
          prompt: `Read lines \`<ncalls> <tottime> <cumtime> <function>\` until EOF — the columns of a \`cProfile\` report. Let the total be the sum of \`tottime\`. Print the top three functions by \`tottime\` (descending; ties by name) as \`<function> tottime=<t:.3f> percall=<t/ncalls:.6f> share=<percentage of total:.1f>%\`, then \`total <sum:.3f>s\`.

**Input:** one function per line.
**Output:** up to three lines, then the total.

\`\`\`text
1 0.001 1.204 main
1000 0.902 1.150 parse
1000 0.248 0.248 tokenize
\`\`\`
prints
\`\`\`text
parse tottime=0.902 percall=0.000902 share=78.4%
tokenize tottime=0.248 percall=0.000248 share=21.5%
main tottime=0.001 percall=0.001000 share=0.1%
total 1.151s
\`\`\``,
          starter: String.raw`import sys

rows = []
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 4:
        continue
    ncalls, tottime, cumtime, name = int(parts[0]), float(parts[1]), float(parts[2]), parts[3]
    rows.append((name, ncalls, tottime, cumtime))

# TODO: total, sort, print the top three and the total
`,
          solution: String.raw`import sys

rows = []
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 4:
        continue
    ncalls, tottime, cumtime, name = int(parts[0]), float(parts[1]), float(parts[2]), parts[3]
    rows.append((name, ncalls, tottime, cumtime))

total = sum(row[2] for row in rows)
for name, ncalls, tottime, _ in sorted(rows, key=lambda row: (-row[2], row[0]))[:3]:
    print(f"{name} tottime={tottime:.3f} percall={tottime / ncalls:.6f} share={100 * tottime / total:.1f}%")
print(f"total {total:.3f}s")
`,
          hints: [
            "`tottime` excludes callees, so its sum over all functions is the whole run — that is the denominator for the share.",
            "Sort by `(-tottime, name)` so ties fall back to alphabetical order.",
          ],
          cases: [
            { stdin: "1 0.001 1.204 main\n1000 0.902 1.150 parse\n1000 0.248 0.248 tokenize\n", expected: "parse tottime=0.902 percall=0.000902 share=78.4%\ntokenize tottime=0.248 percall=0.000248 share=21.5%\nmain tottime=0.001 percall=0.001000 share=0.1%\ntotal 1.151s\n" },
            { stdin: "5 0.500 0.500 a\n5 0.500 0.500 b\n", expected: "a tottime=0.500 percall=0.100000 share=50.0%\nb tottime=0.500 percall=0.100000 share=50.0%\ntotal 1.000s\n", hidden: true },
            { stdin: "2 0.200 0.300 load\n4 0.100 0.100 parse\n1 0.700 1.000 run\n10 0.050 0.050 log\n", expected: "run tottime=0.700 percall=0.700000 share=66.7%\nload tottime=0.200 percall=0.100000 share=19.0%\nparse tottime=0.100 percall=0.025000 share=9.5%\ntotal 1.050s\n", hidden: true },
          ],
        },
        {
          title: "A stopwatch with an injected clock",
          prompt: `Write \`Stopwatch(clock)\` whose \`measure(label)\` is a context manager (use \`contextlib.contextmanager\`) that reads \`clock()\` on entry and on exit and records \`(label, elapsed)\`. Read a line of clock readings (floats) and a line of labels; make the clock return the readings in order (\`iter(readings).__next__\`) and measure one empty block per label. Print \`<label> <elapsed:.3f>s\` per label, \`total <sum:.3f>s\` and \`slowest <label>\` (the first maximum).

**Input:** the readings, then the labels.
**Output:** one line per label, then two summary lines.

\`\`\`text
0.0 0.25 0.3 1.1
parse render
\`\`\`
prints
\`\`\`text
parse 0.250s
render 0.800s
total 1.050s
slowest render
\`\`\``,
          starter: String.raw`from contextlib import contextmanager


class Stopwatch:
    def __init__(self, clock):
        self.clock = clock
        self.records = []

    @contextmanager
    def measure(self, label):
        # TODO: read the clock before and after the block
        yield


readings = [float(x) for x in input().split()]
labels = input().split()
clock = iter(readings).__next__
watch = Stopwatch(clock)
# TODO: measure an empty block per label, then report
`,
          solution: String.raw`from contextlib import contextmanager


class Stopwatch:
    def __init__(self, clock):
        self.clock = clock
        self.records = []

    @contextmanager
    def measure(self, label):
        start = self.clock()
        try:
            yield
        finally:
            self.records.append((label, self.clock() - start))


readings = [float(x) for x in input().split()]
labels = input().split()
clock = iter(readings).__next__
watch = Stopwatch(clock)
for label in labels:
    with watch.measure(label):
        pass

for label, elapsed in watch.records:
    print(f"{label} {elapsed:.3f}s")
print(f"total {sum(elapsed for _, elapsed in watch.records):.3f}s")
print("slowest", max(watch.records, key=lambda record: record[1])[0])
`,
          hints: [
            "`try: yield / finally:` records the time even when the block raises — the shape of a real timer.",
            "Because the clock is injected, the same class runs with `time.perf_counter` in production and a scripted iterator here.",
          ],
          cases: [
            { stdin: "0.0 0.25 0.3 1.1\nparse render\n", expected: "parse 0.250s\nrender 0.800s\ntotal 1.050s\nslowest render\n" },
            { stdin: "1.5 1.5\nnoop\n", expected: "noop 0.000s\ntotal 0.000s\nslowest noop\n", hidden: true },
            { stdin: "0 2 2 3 3 3.5\na b c\n", expected: "a 2.000s\nb 1.000s\nc 0.500s\ntotal 3.500s\nslowest a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which clock is right for measuring a duration?",
          options: ["`time.time()`", "`time.perf_counter()`", "`datetime.now()`", "`time.ctime()`"],
          answer: 1,
          explanation: "Monotonic and high resolution; wall-clock time can jump.",
        },
        {
          prompt: "Which statistic should a `timeit` benchmark report?",
          options: ["The mean", "The minimum of the repeats — noise only adds time", "The maximum", "The first run"],
          answer: 1,
          explanation: "`min(timeit.repeat(...))` is the number to quote.",
        },
        {
          prompt: "In a `cProfile` report, what is `tottime`?",
          options: ["Time including callees", "Time inside the function itself, excluding callees", "Wall-clock time", "Time per call"],
          answer: 1,
          explanation: "`cumtime` includes callees; `tottime` finds the function doing the work.",
        },
        {
          prompt: "What does `tracemalloc` attribute allocations to?",
          options: ["Threads", "The source lines (call sites) that allocated", "Types only", "Nothing"],
          answer: 1,
          explanation: "Comparing two snapshots shows which lines caused the growth; `get_traced_memory` gives current and peak.",
        },
        {
          prompt: "A phase takes 75 % of the run time. What is the most its optimisation can gain?",
          options: ["75 %", "4× — Amdahl's rule", "Unlimited", "1.75×"],
          answer: 1,
          explanation: "Even infinitely fast, the other 25 % remains; optimise the largest slice first and re-profile.",
        },
      ],
    },
    {
      slug: "numeric-performance",
      file: "05-numeric-performance.md",
      exercises: [
        {
          title: "Vectorised statistics",
          prompt: `Read \`n seed\`. Generate \`xs = [rng.randrange(1000) for _ in range(n)]\` with \`rng = random.Random(seed)\`, convert once to a NumPy array with \`dtype=np.int64\`, and compute everything with array operations — no Python loop over elements. Print \`count <n>\`, \`mean <mean:.3f>\`, \`max <max>\`, \`above 500 = <count of values greater than 500>\`, \`evens <count of even values>\` and \`sumsq <sum of squares>\`.

**Input:** \`n seed\`.
**Output:** six lines.

\`\`\`text
10 1
\`\`\`
prints
\`\`\`text
count 10
mean 492.000
max 867
above 500 = 6
evens 4
sumsq 3345254
\`\`\``,
          starter: String.raw`import random

import numpy as np

n, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(1000) for _ in range(n)]
arr = np.array(xs, dtype=np.int64)

# TODO: the six lines, all from array operations
`,
          solution: String.raw`import random

import numpy as np

n, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(1000) for _ in range(n)]
arr = np.array(xs, dtype=np.int64)

print("count", arr.size)
print(f"mean {arr.mean():.3f}")
print("max", int(arr.max()))
print("above 500 =", int((arr > 500).sum()))
print("evens", int((arr % 2 == 0).sum()))
print("sumsq", int((arr * arr).sum()))
`,
          hints: [
            "A comparison on an array gives a boolean array; its `.sum()` is the count of `True`.",
            "Convert NumPy scalars with `int(...)` before printing so the output has no `np.int64(...)` wrapper on any version.",
          ],
          cases: [
            { stdin: "10 1\n", expected: "count 10\nmean 492.000\nmax 867\nabove 500 = 6\nevens 4\nsumsq 3345254\n" },
            { stdin: "200000 7\n", expected: "count 200000\nmean 499.074\nmax 999\nabove 500 = 99692\nevens 99950\nsumsq 66479776970\n", hidden: true },
            { stdin: "1 3\n", expected: "count 1\nmean 243.000\nmax 243\nabove 500 = 0\nevens 0\nsumsq 59049\n", hidden: true },
          ],
        },
        {
          title: "Checksums over bytes",
          prompt: `Read \`n seed\`. Generate \`data = random.Random(seed).randbytes(n)\`. Print \`bytes <n>\`, \`zeros <data.count(0)>\`, \`max <max(data)>\`, \`sum16 <sum(data) % 65536>\` and \`fletcher16 <checksum>\`, where the Fletcher-16 checksum iterates over a \`memoryview\` of the data keeping two running sums modulo 255 (\`s1 = (s1 + byte) % 255\`, \`s2 = (s2 + s1) % 255\`) and returns \`(s2 << 8) | s1\`. The first four values come from C-speed byte methods; the last is the one Python loop.

**Input:** \`n seed\`.
**Output:** five lines.

\`\`\`text
16 1
\`\`\`
prints
\`\`\`text
bytes 16
zeros 0
max 245
sum16 2245
fletcher16 32461
\`\`\``,
          starter: String.raw`import random

n, seed = map(int, input().split())
data = random.Random(seed).randbytes(n)


def fletcher16(buffer):
    # TODO: loop over memoryview(buffer)
    return 0


print("bytes", n)
# TODO: zeros, max, sum16, fletcher16
`,
          solution: String.raw`import random

n, seed = map(int, input().split())
data = random.Random(seed).randbytes(n)


def fletcher16(buffer):
    s1 = s2 = 0
    for byte in memoryview(buffer):
        s1 = (s1 + byte) % 255
        s2 = (s2 + s1) % 255
    return (s2 << 8) | s1


print("bytes", n)
print("zeros", data.count(0))
print("max", max(data))
print("sum16", sum(data) % 65536)
print("fletcher16", fletcher16(data))
`,
          hints: [
            "Iterating a `bytes` object or a `memoryview` yields ints 0–255; `count`, `max` and `sum` run in C.",
            "Keep the two sums reduced modulo 255 on every step so the ints stay small.",
          ],
          cases: [
            { stdin: "16 1\n", expected: "bytes 16\nzeros 0\nmax 245\nsum16 2245\nfletcher16 32461\n" },
            { stdin: "300000 9\n", expected: "bytes 300000\nzeros 1119\nmax 255\nsum16 775\nfletcher16 47443\n", hidden: true },
            { stdin: "1 4\n", expected: "bytes 1\nzeros 0\nmax 60\nsum16 60\nfletcher16 15420\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is a Python loop summing floats slow?",
          options: ["Floats are big", "Each element is a boxed object: a dispatch, an allocation and refcount updates per operation", "Loops are compiled", "The GIL"],
          answer: 1,
          explanation: "Unboxed storage plus a C loop — `sum`, `array`, NumPy — removes all three costs.",
        },
        {
          prompt: "What does `memoryview(buf)[512:]` cost?",
          options: ["A copy of the tail", "Nothing but a small view object — writes go through to `buf`", "A new `bytes`", "A list"],
          answer: 1,
          explanation: "Views slice any buffer without copying.",
        },
        {
          prompt: "What happens to `np.arange(10**6, dtype=np.int64) ** 3` at the top?",
          options: ["Promotion to Python ints", "Silent overflow — int64 wraps", "An exception", "Conversion to float"],
          answer: 1,
          explanation: "Choose the dtype for the values' range; NumPy does not grow integers.",
        },
        {
          prompt: "Which expression is vectorised?",
          options: ["`[f(x) for x in arr]`", "`np.where(arr > 0, arr, 0)`", "`for i in range(len(arr)): out[i] = arr[i] * 2`", "`list(map(f, arr))`"],
          answer: 1,
          explanation: "One C loop over the whole array; the others iterate element by element in Python.",
        },
        {
          prompt: "How do `row` of shape (3,) and `col` of shape (2, 1) add?",
          options: ["They cannot", "By broadcasting to shape (2, 3)", "Elementwise after truncation", "As a dot product"],
          answer: 1,
          explanation: "Dimensions align from the right and size-1 dimensions stretch.",
        },
      ],
    },
    {
      slug: "writing-fast-python",
      file: "06-writing-fast-python.md",
      exercises: [
        {
          title: "Grid paths with @cache",
          prompt: `Read \`n seed p\`. Build an \`n × n\` grid where cell \`(r, c)\` is blocked when \`rng.randrange(100) < p\` (draw the cells row by row, but the start \`(0, 0)\` and the end \`(n-1, n-1)\` are never blocked — still draw for them, then force them open). Count the paths from the start to the end moving only right or down through open cells with a recursive function decorated with \`functools.cache\` — without the cache the hidden case is exponential. Print \`blocked <count of blocked cells>\` and \`paths <count>\`.

**Input:** \`n seed p\`.
**Output:** two lines.

\`\`\`text
4 5 30
\`\`\`
prints
\`\`\`text
blocked 3
paths 9
\`\`\``,
          starter: String.raw`import random
import sys
from functools import cache

sys.setrecursionlimit(10000)
n, seed, p = map(int, input().split())
rng = random.Random(seed)
blocked = [[rng.randrange(100) < p for _ in range(n)] for _ in range(n)]
blocked[0][0] = blocked[n - 1][n - 1] = False


@cache
def paths(r, c):
    # TODO: number of paths from (r, c) to the end
    return 0


print("blocked", sum(map(sum, blocked)))
print("paths", paths(0, 0))
`,
          solution: String.raw`import random
import sys
from functools import cache

sys.setrecursionlimit(10000)
n, seed, p = map(int, input().split())
rng = random.Random(seed)
blocked = [[rng.randrange(100) < p for _ in range(n)] for _ in range(n)]
blocked[0][0] = blocked[n - 1][n - 1] = False


@cache
def paths(r, c):
    if r >= n or c >= n or blocked[r][c]:
        return 0
    if r == n - 1 and c == n - 1:
        return 1
    return paths(r + 1, c) + paths(r, c + 1)


print("blocked", sum(map(sum, blocked)))
print("paths", paths(0, 0))
`,
          hints: [
            "Out of the grid or on a blocked cell there are no paths; at the end there is one; otherwise sum the two moves.",
            "`@cache` makes each `(r, c)` computed once, so the work is n² calls instead of a number that grows exponentially.",
          ],
          cases: [
            { stdin: "4 5 30\n", expected: "blocked 3\npaths 9\n" },
            { stdin: "60 7 20\n", expected: "blocked 760\npaths 228015221483220048420\n", hidden: true },
            { stdin: "1 1 0\n", expected: "blocked 0\npaths 1\n", hidden: true },
          ],
        },
        {
          title: "Prefix sums for range queries",
          prompt: `Read \`n q seed\`. Generate \`xs = [rng.randrange(-1000, 1000) for _ in range(n)]\`, then \`q\` queries each drawn as \`i = rng.randrange(n)\` followed by \`j = rng.randrange(i, n)\` (inclusive range \`i..j\`). Answer every query in O(1) with a prefix-sum array built once — a fresh \`sum(xs[i:j + 1])\` per query is O(n·q) and will not finish the hidden case. Print \`queries <q>\`, \`sum of answers <total>\`, \`max answer <largest>\` and \`min answer <smallest>\`.

**Input:** \`n q seed\`.
**Output:** four lines.

\`\`\`text
6 3 1
\`\`\`
prints
\`\`\`text
queries 3
sum of answers 2278
max answer 1207
min answer 336
\`\`\``,
          starter: String.raw`import random

n, q, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(-1000, 1000) for _ in range(n)]
queries = []
for _ in range(q):
    i = rng.randrange(n)
    j = rng.randrange(i, n)
    queries.append((i, j))

# TODO: prefix sums, answers, the four lines
`,
          solution: String.raw`import random

n, q, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(-1000, 1000) for _ in range(n)]
queries = []
for _ in range(q):
    i = rng.randrange(n)
    j = rng.randrange(i, n)
    queries.append((i, j))

prefix = [0]
for x in xs:
    prefix.append(prefix[-1] + x)

answers = [prefix[j + 1] - prefix[i] for i, j in queries]
print("queries", q)
print("sum of answers", sum(answers))
print("max answer", max(answers))
print("min answer", min(answers))
`,
          hints: [
            "`prefix[k]` is the sum of the first `k` values; the sum of `xs[i..j]` is `prefix[j + 1] - prefix[i]`.",
            "Draw all the queries first, in the stated order, so the random stream matches the expected output.",
          ],
          cases: [
            { stdin: "6 3 1\n", expected: "queries 3\nsum of answers 2278\nmax answer 1207\nmin answer 336\n" },
            { stdin: "100000 100000 5\n", expected: "queries 100000\nsum of answers -3762059703\nmax answer 147554\nmin answer -274521\n", hidden: true },
            { stdin: "1 1 9\n", expected: "queries 1\nsum of answers -52\nmax answer -52\nmin answer -52\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the first question when a program is too slow?",
          options: ["Which loop to unroll", "Is the algorithm right — what is the operation count as a function of n?", "Which C extension to use", "Whether to disable the GC"],
          answer: 1,
          explanation: "Each level of the checklist dwarfs the next; a quadratic algorithm is slow in any language.",
        },
        {
          prompt: "What does a prefix-sum array buy?",
          options: ["Faster sorting", "Any range sum in O(1) after one O(n) pass", "Less memory", "Exact floats"],
          answer: 1,
          explanation: "`prefix[j + 1] - prefix[i]`.",
        },
        {
          prompt: "How should a hundred thousand integers be read from standard input?",
          options: ["`input()` in a loop", "`sys.stdin.buffer.read().split()` once, then `map(int, ...)`", "`readline` per number", "`eval(input())`"],
          answer: 1,
          explanation: "One read and one split; per-line calls each cost a system call and a decode.",
        },
        {
          prompt: "Which micro-optimisation belongs only in a profiled hot loop?",
          options: ["Using a set for membership", "Binding `append = out.append` before the loop", "Using `join` for strings", "Choosing the right algorithm"],
          answer: 1,
          explanation: "Hoisting lookups is worth 10–40 % on the loop that matters and nothing elsewhere; the others are always right.",
        },
        {
          prompt: "When should optimisation stop?",
          options: ["Never", "When the target number is met — every further change costs readability", "When the code has no loops", "At 100 % coverage"],
          answer: 1,
          explanation: "The readable version is what gets maintained.",
        },
      ],
    },
    {
      slug: "performance-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Top-k with a heap",
          prompt: `Read \`n k seed\`. Generate \`xs = [rng.randrange(10**9) for _ in range(n)]\` with \`rng = random.Random(seed)\` and find the \`k\` largest values with \`heapq.nlargest\` — O(n log k), not a full sort. Print \`top <the k values, largest first, space-separated>\` and \`threshold <the k-th largest>\`.

**Input:** \`n k seed\`.
**Output:** two lines.

\`\`\`text
10 3 1
\`\`\`
prints
\`\`\`text
top 909925047 861425548 820096753
threshold 820096753
\`\`\``,
          starter: String.raw`import heapq
import random

n, k, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(10**9) for _ in range(n)]

# TODO: nlargest, the two lines
`,
          solution: String.raw`import heapq
import random

n, k, seed = map(int, input().split())
rng = random.Random(seed)
xs = [rng.randrange(10**9) for _ in range(n)]

top = heapq.nlargest(k, xs)
print("top", " ".join(map(str, top)))
print("threshold", top[-1])
`,
          hints: [
            "`heapq.nlargest(k, xs)` returns the k largest in descending order.",
            "The last element of that list is the k-th largest — the threshold.",
          ],
          cases: [
            { stdin: "10 3 1\n", expected: "top 909925047 861425548 820096753\nthreshold 820096753\n" },
            { stdin: "300000 5 9\n", expected: "top 999998592 999997165 999994510 999991551 999990075\nthreshold 999990075\n", hidden: true },
            { stdin: "1 1 2\n", expected: "top 926756582\nthreshold 926756582\n", hidden: true },
          ],
        },
        {
          title: "Order-preserving de-duplication",
          prompt: `Read \`n seed\`. Generate \`words = [f"w{rng.randrange(20000)}" for _ in range(n)]\`. Remove duplicates keeping the first occurrence of each word, in O(n) with a \`seen\` set — a list membership test per word is O(n·d) and will not finish the hidden case. Print \`distinct <count>\`, \`first <the first five distinct words>\` and \`last <the last five distinct words>\` (fewer when there are fewer).

**Input:** \`n seed\`.
**Output:** three lines.

\`\`\`text
12 1
\`\`\`
prints
\`\`\`text
distinct 12
first w4402 w18651 w2067 w8358 w3863
last w15474 w12439 w6879 w3075 w15986
\`\`\``,
          starter: String.raw`import random

n, seed = map(int, input().split())
rng = random.Random(seed)
words = [f"w{rng.randrange(20000)}" for _ in range(n)]


def dedupe(items):
    # TODO: first occurrences, in order, with a set
    return []


distinct = dedupe(words)
print("distinct", len(distinct))
print("first", " ".join(distinct[:5]))
print("last", " ".join(distinct[-5:]))
`,
          solution: String.raw`import random

n, seed = map(int, input().split())
rng = random.Random(seed)
words = [f"w{rng.randrange(20000)}" for _ in range(n)]


def dedupe(items):
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


distinct = dedupe(words)
print("distinct", len(distinct))
print("first", " ".join(distinct[:5]))
print("last", " ".join(distinct[-5:]))
`,
          hints: [
            "One pass; the set answers `in` in O(1) and the list keeps the order.",
            "`dict.fromkeys(items)` is the one-line version — dicts keep insertion order.",
          ],
          cases: [
            { stdin: "12 1\n", expected: "distinct 12\nfirst w4402 w18651 w2067 w8358 w3863\nlast w15474 w12439 w6879 w3075 w15986\n" },
            { stdin: "200000 4\n", expected: "distinct 19998\nfirst w7734 w9938 w3380 w12978 w15691\nlast w14076 w10127 w10005 w16300 w5632\n", hidden: true },
            { stdin: "1 5\n", expected: "distinct 1\nfirst w8370\nlast w8370\n", hidden: true },
          ],
        },
        {
          title: "Frequencies with stable ties",
          prompt: `Read \`n seed\`. Generate \`tokens = [f"t{rng.randrange(50)}" for _ in range(n)]\`. Count them with \`collections.Counter\` and print the five most frequent (fewer if there are fewer distinct) as \`<token> <count>\`, ordered by count descending and then by token ascending — \`most_common\` alone does not define the tie order, so sort explicitly. Finish with \`distinct <number of distinct tokens>\`.

**Input:** \`n seed\`.
**Output:** five lines, then the count.

\`\`\`text
30 1
\`\`\`
prints
\`\`\`text
t48 3
t24 2
t28 2
t31 2
t6 2
distinct 24
\`\`\``,
          starter: String.raw`import random
from collections import Counter

n, seed = map(int, input().split())
rng = random.Random(seed)
tokens = [f"t{rng.randrange(50)}" for _ in range(n)]

# TODO: Counter, explicit sort, top five, distinct
`,
          solution: String.raw`import random
from collections import Counter

n, seed = map(int, input().split())
rng = random.Random(seed)
tokens = [f"t{rng.randrange(50)}" for _ in range(n)]

counts = Counter(tokens)
for token, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:5]:
    print(token, count)
print("distinct", len(counts))
`,
          hints: [
            "`Counter(tokens)` is one C-speed pass; sorting 50 distinct entries costs nothing.",
            "The key `(-count, token)` gives count descending and token ascending in one sort.",
          ],
          cases: [
            { stdin: "30 1\n", expected: "t48 3\nt24 2\nt28 2\nt31 2\nt6 2\ndistinct 24\n" },
            { stdin: "300000 8\n", expected: "t35 6139\nt8 6125\nt7 6117\nt13 6112\nt40 6095\ndistinct 50\n", hidden: true },
            { stdin: "5 2\n", expected: "t5 2\nt10 1\nt23 1\nt3 1\ndistinct 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "When is an object freed by reference counting?",
          options: ["At the next `gc.collect()`", "The moment its last reference goes", "At function return only", "At interpreter exit"],
          answer: 1,
          explanation: "Immediate and predictable; only cycles wait for the collector.",
        },
        {
          prompt: "Which pair of objects needs the cycle collector?",
          options: ["Two ints", "A list and a dict that reference each other", "A string and its slice", "Two tuples of ints"],
          answer: 1,
          explanation: "Their counts never reach zero on their own; atoms are not even tracked.",
        },
        {
          prompt: "`x in xs` for a list of a million items inside a loop of a million queries costs about…",
          options: ["10⁶ operations", "10¹² operations — a set makes it 10⁶", "10⁹ operations", "Nothing"],
          answer: 1,
          explanation: "Linear membership inside a linear loop.",
        },
        {
          prompt: "Which is the O(1) queue in the standard library?",
          options: ["`list` with `pop(0)`", "`collections.deque` with `popleft()`", "`heapq`", "`tuple`"],
          answer: 1,
          explanation: "A list shifts every element on a front pop.",
        },
        {
          prompt: "Why is `LOAD_GLOBAL` slower than `LOAD_FAST`?",
          options: ["It is not", "It is a dictionary lookup (globals then builtins) rather than an indexed slot read", "It allocates", "It calls a function"],
          answer: 1,
          explanation: "Hence binding a global to a local before a hot loop.",
        },
        {
          prompt: "What did the 3.11 specialising interpreter change for code you write?",
          options: ["Nothing observable", "Stable types in hot loops and `try/except` for rare cases are rewarded; no source changes needed", "Loops must be annotated", "Globals are free"],
          answer: 1,
          explanation: "Specialised instructions and zero-cost exceptions.",
        },
        {
          prompt: "What is the right tool to find which function a slow program spends its time in?",
          options: ["`timeit`", "`cProfile` sorted by `tottime`", "`time.time()` around `main`", "`dis`"],
          answer: 1,
          explanation: "`timeit` compares candidates; the profiler attributes.",
        },
        {
          prompt: "Why measure the second run rather than the first?",
          options: ["The first is faster", "The first pays for imports, compilation, caches and the specialiser warming up", "There is no difference", "The clock is wrong at first"],
          answer: 1,
          explanation: "Warm-up is part of benchmarking hygiene.",
        },
        {
          prompt: "What is the memory of a Python list of a million floats, roughly?",
          options: ["8 MB", "8 MB of pointers plus 24 MB of float objects", "4 MB", "1 MB"],
          answer: 1,
          explanation: "A NumPy float64 array of the same values is 8 MB total.",
        },
        {
          prompt: "Which replaces a per-element Python loop over a NumPy array?",
          options: ["A `while` loop", "Ufuncs, boolean masks and reductions — one C loop over the array", "`map` with a lambda", "Recursion"],
          answer: 1,
          explanation: "Vectorisation is the whole benefit; an element loop throws it away.",
        },
        {
          prompt: "What does `@functools.cache` do for a recursive function with overlapping subproblems?",
          options: ["Nothing", "Each distinct argument tuple is computed once — exponential becomes polynomial", "Makes it iterative", "Reduces recursion depth"],
          answer: 1,
          explanation: "The recursion depth is unchanged; `sys.setrecursionlimit` may still be needed.",
        },
        {
          prompt: "In what order should performance fixes be attempted?",
          options: ["Micro-optimisations first", "Algorithm, data structure, work in C, I/O, hot loop, escape hatches", "C extension first", "Random order"],
          answer: 1,
          explanation: "Each level dwarfs the next; stop when the target is met.",
        },
      ],
    },
  ],
});
