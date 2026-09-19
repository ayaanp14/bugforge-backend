import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "decorators-and-metaprogramming",
  title: "Decorators, descriptors and the data model",
  blurb: "Decorators as functions wrapping functions with wraps, arguments and stacking; closures with cells, late binding and factories; the descriptor protocol behind properties and methods; the attribute hooks and reflection; classes as objects with type, __new__ and __init_subclass__; and the rest of the data model through a Vector.",
  icon: "generic",
  overview: `Everything in this module rests on one fact stated in Module 1: functions and classes are objects. A decorator is a function applied to a function; a descriptor is an object that intercepts attribute access; a class is an instance of \`type\` that can be created from data and hooked when subclassed; an operator is a call to a method the class defines. These are the mechanisms behind \`@property\`, \`@dataclass\`, \`@cache\`, ORMs, plugin systems and every library that seems to extend the language — and once the mechanism is visible, using or building such a thing is ordinary code.

Decorators covers the desugaring, \`@wraps\`, the common wrappers, factories with arguments, stacking order and class decorators. Closures and late binding goes underneath to cells, then to factories, accumulators with \`nonlocal\`, callbacks and the point at which a closure becomes a class with \`__call__\`. Descriptors states the protocol and the lookup order, builds a validated attribute with \`__set_name__\`, and re-derives \`property\`, methods and \`cached_property\`. Attribute access covers \`__getattr__\`, \`__getattribute__\`, \`__setattr__\`, reflection and \`__slots__\`. Classes as objects covers \`type(name, bases, ns)\`, \`__new__\`, \`__init_subclass__\`, \`__class_getitem__\` and metaclasses in outline. The data model completes the dunder map and builds a \`Vector\`.

The exercises are whole programs: traced and counted functions, a \`retry\` factory, closure cells inspected, an accumulator pair, a \`Positive\` descriptor, a hand-written cached property, a dict-backed configuration with \`__getattr__\`, a frozen object with \`__setattr__\`, a plugin registry driven by \`__init_subclass__\` with classes created by \`type()\`, a singleton and an immutable subclass via \`__new__\`, a \`Vector\`, and a grid with tuple keys and \`__missing__\`. The checkpoint adds a decorator suite stacked both ways, a small validation framework, and the complete \`Vector\`.`,
  lessons: [
    {
      slug: "decorators",
      file: "01-decorators.md",
      exercises: [
        {
          title: "Traced and counted",
          prompt: `Write two decorators with \`functools.wraps\`: \`traced\` prints \`-> <name>(<args comma-separated>)\` before the call and \`<- <name> = <result>\` after; \`counted\` keeps \`wrapper.calls\` on the wrapper. Apply both to \`add(a, b)\` and \`square(x)\` as \`@counted\` over \`@traced\`. Run lines \`add 2 3\` / \`square 4\`, then print \`calls add=<n> square=<n>\` and \`names <add.__name__> <square.__name__>\`.

**Input:** call lines.
**Output:** the trace lines, then the two summary lines.

\`\`\`text
add 2 3
square 4
\`\`\`
prints
\`\`\`text
-> add(2, 3)
<- add = 5
-> square(4)
<- square = 16
calls add=1 square=1
names add square
\`\`\``,
          starter: String.raw`import sys
from functools import wraps


def traced(fn):
    # TODO
    return fn


def counted(fn):
    # TODO: wrapper.calls
    return fn


@counted
@traced
def add(a, b):
    return a + b


@counted
@traced
def square(x):
    return x * x


for line in sys.stdin:
    name, *nums = line.split()
    {"add": add, "square": square}[name](*map(int, nums))
print(f"calls add={add.calls} square={square.calls}")
print(f"names {add.__name__} {square.__name__}")
`,
          solution: String.raw`import sys
from functools import wraps


def traced(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"-> {fn.__name__}({', '.join(map(str, args))})")
        result = fn(*args, **kwargs)
        print(f"<- {fn.__name__} = {result}")
        return result
    return wrapper


def counted(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return fn(*args, **kwargs)
    wrapper.calls = 0
    return wrapper


@counted
@traced
def add(a, b):
    return a + b


@counted
@traced
def square(x):
    return x * x


for line in sys.stdin:
    name, *nums = line.split()
    {"add": add, "square": square}[name](*map(int, nums))
print(f"calls add={add.calls} square={square.calls}")
print(f"names {add.__name__} {square.__name__}")
`,
          hints: [
            "`@wraps(fn)` is what makes `add.__name__` say `add` and `fn.__name__` inside `traced` say the original name.",
            "`counted`'s state is an attribute on the wrapper function object, set after the `def`.",
          ],
          cases: [
            { stdin: "add 2 3\nsquare 4\n", expected: "-> add(2, 3)\n<- add = 5\n-> square(4)\n<- square = 16\ncalls add=1 square=1\nnames add square\n" },
            { stdin: "square 1\nsquare -2\n", expected: "-> square(1)\n<- square = 1\n-> square(-2)\n<- square = 4\ncalls add=0 square=2\nnames add square\n", hidden: true },
          ],
        },
        {
          title: "A retry factory",
          prompt: `Write \`retry(times)\` — a decorator factory — whose wrapper calls the function up to \`times\` times, printing \`attempt <n> failed: <message>\` for each \`TransientError\`, returning the first successful result, and re-raising the last error when all attempts fail. Decorate \`fetch\`, which fails the first \`k\` times (read from input) then returns \`"data"\`. Read \`k times\` and print \`result <value>\` or \`gave up\`, then \`fetch.__name__\`.

**Input:** \`k times\`.
**Output:** the attempt lines, the outcome, then the name.

\`\`\`text
2 3
\`\`\`
prints
\`\`\`text
attempt 1 failed: flaky
attempt 2 failed: flaky
result data
name fetch
\`\`\``,
          starter: String.raw`from functools import wraps


class TransientError(Exception):
    pass


def retry(times):
    # TODO: three levels
    def decorator(fn):
        return fn
    return decorator


k, times = map(int, input().split())
failures = [k]


@retry(times)
def fetch():
    if failures[0] > 0:
        failures[0] -= 1
        raise TransientError("flaky")
    return "data"


try:
    print(f"result {fetch()}")
except TransientError:
    print("gave up")
print(f"name {fetch.__name__}")
`,
          solution: String.raw`from functools import wraps


class TransientError(Exception):
    pass


def retry(times):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            last = None
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except TransientError as e:
                    last = e
                    print(f"attempt {attempt} failed: {e}")
            raise last
        return wrapper
    return decorator


k, times = map(int, input().split())
failures = [k]


@retry(times)
def fetch():
    if failures[0] > 0:
        failures[0] -= 1
        raise TransientError("flaky")
    return "data"


try:
    print(f"result {fetch()}")
except TransientError:
    print("gave up")
print(f"name {fetch.__name__}")
`,
          hints: [
            "`retry(3)` runs first and returns `decorator`; `decorator(fetch)` returns the wrapper — `fetch = retry(3)(fetch)`.",
            "Keep the last exception so the wrapper can re-raise it after the final attempt.",
          ],
          cases: [
            { stdin: "2 3\n", expected: "attempt 1 failed: flaky\nattempt 2 failed: flaky\nresult data\nname fetch\n" },
            { stdin: "5 2\n", expected: "attempt 1 failed: flaky\nattempt 2 failed: flaky\ngave up\nname fetch\n", hidden: true },
            { stdin: "0 1\n", expected: "result data\nname fetch\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this expand to?\n\n```python\n@deco\ndef f(): ...\n```",
          options: ["`deco(f())`", "`f = deco(f)`", "`f = deco`", "`deco.f = f`"],
          answer: 1,
          explanation: "The decorator is applied once, at definition time, and the name is rebound to its result.",
        },
        {
          prompt: "Without `@wraps`, what is `f.__name__` after decoration?",
          options: ["`'f'`", "`'wrapper'`", "`None`", "`'deco'`"],
          answer: 1,
          explanation: "The name is rebound to the wrapper function; `wraps` copies the metadata across.",
        },
        {
          prompt: "How many nested functions does `@retry(3)` need?",
          options: ["One", "Two", "Three: the factory, the decorator, the wrapper", "Four"],
          answer: 2,
          explanation: "The factory takes the arguments and returns a decorator; the decorator takes the function and returns the wrapper.",
        },
        {
          prompt: "For `@a` above `@b` above `def f`, which runs outermost on a call?",
          options: ["`b`", "`a`", "Neither", "They alternate"],
          answer: 1,
          explanation: "`f = a(b(f))`: `b` wraps first, `a` wraps the result and sees every call first.",
        },
        {
          prompt: "What does a class decorator receive and return?",
          options: ["An instance", "The class, returning the class or a replacement", "The metaclass", "A dict"],
          answer: 1,
          explanation: "`@dataclass` and `@total_ordering` are class decorators of exactly this shape.",
        },
      ],
    },
    {
      slug: "closures-and-late-binding",
      file: "02-closures-and-late-binding.md",
      exercises: [
        {
          title: "Inside the cell",
          prompt: `Write \`make_counter(start)\` returning a closure \`step()\` that increments and returns a \`count\` with \`nonlocal\`. Read \`start\` and \`n\`; print \`step.__code__.co_freevars\`, the cell's contents via \`step.__closure__[0].cell_contents\` before any call, the results of \`n\` calls, and the cell's contents afterwards. Then show late binding: build a list of three lambdas in a loop over \`i\` and a list of three via a factory, and print what each list returns.

**Input:** \`start n\`.
**Output:** \`freevars <tuple>\`, \`cell <v>\`, \`calls <values>\`, \`cell <v>\`, \`loop <values>\`, \`factory <values>\`.

\`\`\`text
10 3
\`\`\`
prints
\`\`\`text
freevars ('count',)
cell 10
calls 11 12 13
cell 13
loop 2 2 2
factory 0 1 2
\`\`\``,
          starter: String.raw`def make_counter(start):
    count = start

    def step():
        # TODO: nonlocal
        return count
    return step


start, n = map(int, input().split())
step = make_counter(start)
# TODO: the six lines
`,
          solution: String.raw`def make_counter(start):
    count = start

    def step():
        nonlocal count
        count += 1
        return count
    return step


start, n = map(int, input().split())
step = make_counter(start)
print(f"freevars {step.__code__.co_freevars}")
print(f"cell {step.__closure__[0].cell_contents}")
print("calls", " ".join(str(step()) for _ in range(n)))
print(f"cell {step.__closure__[0].cell_contents}")
loop = []
for i in range(3):
    loop.append(lambda: i)
factory = [(lambda v: (lambda: v))(i) for i in range(3)]
print("loop", " ".join(str(f()) for f in loop))
print("factory", " ".join(str(f()) for f in factory))
`,
          hints: [
            "`co_freevars` names the enclosed variables; `__closure__` holds their cells.",
            "The factory `(lambda v: (lambda: v))(i)` creates a new scope — and a new cell — per iteration.",
          ],
          cases: [
            { stdin: "10 3\n", expected: "freevars ('count',)\ncell 10\ncalls 11 12 13\ncell 13\nloop 2 2 2\nfactory 0 1 2\n" },
            { stdin: "-1 1\n", expected: "freevars ('count',)\ncell -1\ncalls 0\ncell 0\nloop 2 2 2\nfactory 0 1 2\n", hidden: true },
          ],
        },
        {
          title: "An accumulator pair",
          prompt: `Write \`make_stats()\` returning two closures over shared cells: \`add(x)\` (uses \`nonlocal\` to update a total and a count) and \`summary()\` returning \`count=<n> mean=<m>\` with the mean to two decimals (\`0.00\` when empty). Process \`add x\` and \`summary\` lines. Then create a **second** pair and add one value to it to show the state is separate: print its summary last.

**Input:** lines.
**Output:** one line per \`summary\`, then \`second count=1 mean=<x>\`.

\`\`\`text
add 2
add 4
summary
add 9
summary
\`\`\`
prints
\`\`\`text
count=2 mean=3.00
count=3 mean=5.00
second count=1 mean=100.00
\`\`\``,
          starter: String.raw`import sys


def make_stats():
    total, count = 0.0, 0

    def add(x):
        # TODO
        pass

    def summary():
        # TODO
        return ""

    return add, summary


add, summary = make_stats()
for line in sys.stdin:
    cmd, *rest = line.split()
    if cmd == "add":
        add(float(rest[0]))
    else:
        print(summary())
add2, summary2 = make_stats()
add2(100)
print("second", summary2())
`,
          solution: String.raw`import sys


def make_stats():
    total, count = 0.0, 0

    def add(x):
        nonlocal total, count
        total += x
        count += 1

    def summary():
        mean = total / count if count else 0.0
        return f"count={count} mean={mean:.2f}"

    return add, summary


add, summary = make_stats()
for line in sys.stdin:
    cmd, *rest = line.split()
    if cmd == "add":
        add(float(rest[0]))
    else:
        print(summary())
add2, summary2 = make_stats()
add2(100)
print("second", summary2())
`,
          hints: [
            "Both inner functions close over the same `total` and `count` cells; only `add` rebinds them and needs `nonlocal`.",
            "Each call to `make_stats` creates fresh cells — the second pair starts from zero.",
          ],
          cases: [
            { stdin: "add 2\nadd 4\nsummary\nadd 9\nsummary\n", expected: "count=2 mean=3.00\ncount=3 mean=5.00\nsecond count=1 mean=100.00\n" },
            { stdin: "summary\n", expected: "count=0 mean=0.00\nsecond count=1 mean=100.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does a closure store for an enclosed variable?",
          options: ["A copy of the value at creation", "A cell shared with the enclosing scope, read when the closure runs", "A string name", "Nothing"],
          answer: 1,
          explanation: "That is late binding: the variable's current value is read at call time.",
        },
        {
          prompt: "Why does a factory call per iteration fix loop capture?",
          options: ["It copies the loop variable", "Each call creates its own local — a new cell — for the closure to capture", "It disables late binding", "It does not"],
          answer: 1,
          explanation: "The loop has one variable; the factory has one per call.",
        },
        {
          prompt: "When is `nonlocal` required?",
          options: ["To read an enclosing variable", "To rebind an enclosing variable (`+=`, `=`) from the inner function", "To call the outer function", "Always in closures"],
          answer: 1,
          explanation: "Reading needs nothing; mutating a shared list needs nothing; rebinding needs the declaration.",
        },
        {
          prompt: "What does `f.__closure__` contain?",
          options: ["The source code", "A tuple of cells for the enclosed variables (or `None`)", "The outer function", "The default arguments"],
          answer: 1,
          explanation: "`f.__code__.co_freevars` gives their names in the same order.",
        },
        {
          prompt: "When should a stateful closure become a class?",
          options: ["Never", "When state and operations multiply and need inspection, reset or a `repr`", "When it is called more than once", "When it uses `nonlocal`"],
          answer: 1,
          explanation: "A class with `__call__` keeps the callable interface and gains the rest.",
        },
      ],
    },
    {
      slug: "descriptors-and-properties",
      file: "03-descriptors-and-properties.md",
      exercises: [
        {
          title: "A validated attribute",
          prompt: `Write a descriptor \`Positive\` with \`__set_name__\`, \`__get__\` (returning the descriptor itself when accessed on the class) and \`__set__\` (raising \`ValueError("<name> must be positive, got <v>")\` for values \`<= 0\`), storing each value on the instance under \`_<name>\`. \`Item\` declares \`price = Positive()\` and \`qty = Positive()\`. Process \`set <attr> <value>\` and \`get <attr>\` lines on one item created as \`Item(1, 1)\`; print errors' messages and values; finally print \`type(Item.price).__name__\`.

**Input:** lines.
**Output:** one line per \`get\` and per rejected \`set\`, then the class-access line.

\`\`\`text
set price 5
set qty 0
get price
get qty
\`\`\`
prints
\`\`\`text
qty must be positive, got 0
5
1
Positive
\`\`\``,
          starter: String.raw`import sys


class Positive:
    # TODO: __set_name__, __get__, __set__
    pass


class Item:
    price = Positive()
    qty = Positive()

    def __init__(self, price, qty):
        self.price = price
        self.qty = qty


item = Item(1, 1)
for line in sys.stdin:
    cmd, attr, *rest = line.split()
    # TODO
print(type(Item.price).__name__)
`,
          solution: String.raw`import sys


class Positive:
    def __set_name__(self, owner, name):
        self.name = name
        self.storage = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.storage)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive, got {value}")
        setattr(obj, self.storage, value)


class Item:
    price = Positive()
    qty = Positive()

    def __init__(self, price, qty):
        self.price = price
        self.qty = qty


item = Item(1, 1)
for line in sys.stdin:
    cmd, attr, *rest = line.split()
    if cmd == "set":
        try:
            setattr(item, attr, int(rest[0]))
        except ValueError as e:
            print(e)
    elif cmd == "get":
        print(getattr(item, attr))
print(type(Item.price).__name__)
`,
          hints: [
            "`__set_name__` runs once per attribute at class creation, telling the descriptor which name it guards.",
            "Store the value on the *instance* — the descriptor object is shared by every `Item`.",
          ],
          cases: [
            { stdin: "set price 5\nset qty 0\nget price\nget qty\n", expected: "qty must be positive, got 0\n5\n1\nPositive\n" },
            { stdin: "set price -3\nget price\n", expected: "price must be positive, got -3\n1\nPositive\n", hidden: true },
          ],
        },
        {
          title: "A cached property by hand",
          prompt: `Implement \`Cached\`, a non-data descriptor (only \`__get__\` and \`__set_name__\`) that calls the wrapped function once per instance, stores the result in the instance's \`__dict__\` under the attribute name, and returns it — so later reads never reach the descriptor. Apply it to \`Report.total\`, whose body prints \`computing\` and sums the rows. Read rows, then commands \`total\` (print it) and \`invalidate\` (delete the instance attribute so the next read recomputes).

**Input:** a line of integers, then commands.
**Output:** \`computing\` lines as they happen and the totals.

\`\`\`text
1 2 3
total
total
invalidate
total
\`\`\`
prints
\`\`\`text
computing
6
6
computing
6
\`\`\``,
          starter: String.raw`import sys


class Cached:
    def __init__(self, func):
        self.func = func

    # TODO: __set_name__, __get__


class Report:
    def __init__(self, rows):
        self.rows = rows

    @Cached
    def total(self):
        print("computing")
        return sum(self.rows)


report = Report(list(map(int, input().split())))
for line in sys.stdin:
    cmd = line.strip()
    # TODO
`,
          solution: String.raw`import sys


class Cached:
    def __init__(self, func):
        self.func = func

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        value = self.func(obj)
        obj.__dict__[self.name] = value
        return value


class Report:
    def __init__(self, rows):
        self.rows = rows

    @Cached
    def total(self):
        print("computing")
        return sum(self.rows)


report = Report(list(map(int, input().split())))
for line in sys.stdin:
    cmd = line.strip()
    if cmd == "total":
        print(report.total)
    elif cmd == "invalidate":
        report.__dict__.pop("total", None)
`,
          hints: [
            "Because `Cached` has no `__set__`, an instance attribute of the same name wins the lookup — that is the cache.",
            "Deleting the instance attribute makes the next access fall through to the descriptor again.",
          ],
          cases: [
            { stdin: "1 2 3\ntotal\ntotal\ninvalidate\ntotal\n", expected: "computing\n6\n6\ncomputing\n6\n" },
            { stdin: "\ntotal\n", expected: "computing\n0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What makes an object a descriptor?",
          options: ["Being a class attribute", "Defining `__get__` (and optionally `__set__`/`__delete__`) and being found on the class during lookup", "Having a docstring", "Being a property"],
          answer: 1,
          explanation: "The protocol fires only for class attributes; an instance attribute with `__get__` is just an attribute.",
        },
        {
          prompt: "Which wins: an instance attribute or a data descriptor of the same name?",
          options: ["The instance attribute", "The data descriptor", "Whichever was set last", "It raises"],
          answer: 1,
          explanation: "Data descriptors are checked first; that is why a property cannot be shadowed by writing to `__dict__`.",
        },
        {
          prompt: "Why does `cached_property` deliberately lack `__set__`?",
          options: ["To save memory", "So that the value it stores in the instance dict shadows it on later reads", "Because properties cannot be set", "An oversight"],
          answer: 1,
          explanation: "A non-data descriptor loses to the instance dict — which is exactly the caching mechanism.",
        },
        {
          prompt: "What does `__set_name__` receive?",
          options: ["The instance and the value", "The owner class and the attribute name, at class creation", "Nothing", "The metaclass"],
          answer: 1,
          explanation: "It lets one descriptor class serve many attributes, each knowing its name.",
        },
        {
          prompt: "What turns `instance.method` into a bound method?",
          options: ["`__call__`", "The function's own `__get__`, which binds the instance as the first argument", "`__init__`", "The metaclass"],
          answer: 1,
          explanation: "Plain functions are non-data descriptors; `staticmethod` and `classmethod` are descriptors with different `__get__`s.",
        },
      ],
    },
    {
      slug: "attribute-access",
      file: "04-attribute-access.md",
      exercises: [
        {
          title: "Keys as attributes",
          prompt: `Write \`Config\` holding a dict in \`_data\` with a \`__getattr__\` that serves the dict's keys as attributes and raises \`AttributeError("no setting <name>")\` otherwise. Build it from the first line's \`key=value\` pairs. Then process \`get <name>\` (print the value or the error message), \`has <name>\` (\`hasattr\`), and \`real\` (print \`type(cfg._data).__name__\` to show a real attribute never reaches the hook).

**Input:** the pairs line, then commands.
**Output:** one line per command.

\`\`\`text
host=db port=5432
get host
get user
has port
has user
real
\`\`\`
prints
\`\`\`text
db
no setting user
True
False
dict
\`\`\``,
          starter: String.raw`import sys


class Config:
    def __init__(self, data):
        self._data = data

    # TODO: __getattr__


cfg = Config(dict(tok.split("=", 1) for tok in input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Config:
    def __init__(self, data):
        self._data = data

    def __getattr__(self, name):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(f"no setting {name}") from None


cfg = Config(dict(tok.split("=", 1) for tok in input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "get":
        try:
            print(getattr(cfg, args[0]))
        except AttributeError as e:
            print(e)
    elif cmd == "has":
        print(hasattr(cfg, args[0]))
    elif cmd == "real":
        print(type(cfg._data).__name__)
`,
          hints: [
            "`__getattr__` runs only after normal lookup fails, so `_data` itself is found normally.",
            "Raising `AttributeError` (not returning `None`) is what makes `hasattr` answer correctly.",
          ],
          cases: [
            { stdin: "host=db port=5432\nget host\nget user\nhas port\nhas user\nreal\n", expected: "db\nno setting user\nTrue\nFalse\ndict\n" },
            { stdin: "\nget x\nhas _data\n", expected: "no setting x\nTrue\n", hidden: true },
          ],
        },
        {
          title: "Frozen after construction",
          prompt: `Write \`Frozen(**fields)\` whose \`__init__\` sets the fields through \`object.__setattr__\` and then marks the instance frozen; afterwards \`__setattr__\` and \`__delattr__\` raise \`AttributeError("immutable")\`. Build one from the first line's \`key=value\` pairs, then process \`set k v\`, \`del k\` (print \`immutable\` on failure) and \`get k\` (\`getattr\` with default \`missing\`). Finally print the instance's \`vars\` keys in order.

**Input:** the pairs line, then commands.
**Output:** the command results, then \`fields <keys>\`.

\`\`\`text
x=1 y=2
set x 5
get x
del y
get y
\`\`\`
prints
\`\`\`text
immutable
1
immutable
2
fields x y _frozen
\`\`\``,
          starter: String.raw`import sys


class Frozen:
    def __init__(self, **fields):
        # TODO: object.__setattr__ for each field, then _frozen = True
        pass

    # TODO: __setattr__, __delattr__


obj = Frozen(**dict(tok.split("=", 1) for tok in input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
print("fields", " ".join(vars(obj)))
`,
          solution: String.raw`import sys


class Frozen:
    def __init__(self, **fields):
        for key, value in fields.items():
            object.__setattr__(self, key, value)
        object.__setattr__(self, "_frozen", True)

    def __setattr__(self, name, value):
        if getattr(self, "_frozen", False):
            raise AttributeError("immutable")
        object.__setattr__(self, name, value)

    def __delattr__(self, name):
        raise AttributeError("immutable")


obj = Frozen(**dict(tok.split("=", 1) for tok in input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    try:
        if cmd == "set":
            setattr(obj, args[0], args[1])
        elif cmd == "del":
            delattr(obj, args[0])
        elif cmd == "get":
            print(getattr(obj, args[0], "missing"))
    except AttributeError as e:
        print(e)
print("fields", " ".join(vars(obj)))
`,
          hints: [
            "`self.x = v` inside `__init__` would call your own `__setattr__`; write through `object.__setattr__` to bypass it.",
            "`getattr(self, \"_frozen\", False)` is safe before the flag exists.",
          ],
          cases: [
            { stdin: "x=1 y=2\nset x 5\nget x\ndel y\nget y\n", expected: "immutable\n1\nimmutable\n2\nfields x y _frozen\n" },
            { stdin: "\nset a 1\nget a\n", expected: "immutable\nmissing\nfields _frozen\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "When is `__getattr__` called?",
          options: ["On every attribute read", "Only when normal lookup fails to find the name", "Only for dunder names", "On writes"],
          answer: 1,
          explanation: "`__getattribute__` is the every-read hook; `__getattr__` is the fallback.",
        },
        {
          prompt: "What is wrong with `def __setattr__(self, n, v): self.__dict__[n] = v` … `self.x = 1` inside `__getattribute__`?",
          options: ["Nothing", "`self.x` inside `__getattribute__` calls `__getattribute__` again — infinite recursion", "It is too slow", "It only affects `__dict__`"],
          answer: 1,
          explanation: "Every read hook must delegate to `super().__getattribute__`; every write hook to `object.__setattr__`.",
        },
        {
          prompt: "Why must `__getattr__` raise `AttributeError` for unknown names?",
          options: ["Style", "So that `hasattr` returns `False` and `getattr(obj, n, default)` returns the default", "To log the failure", "It must return `None` instead"],
          answer: 1,
          explanation: "Those helpers work by catching `AttributeError`.",
        },
        {
          prompt: "Does `len(obj)` reach `__getattr__` when `__len__` is not defined?",
          options: ["Yes", "No — special methods are looked up on the type, bypassing instance hooks", "Only for old-style classes", "Only with `__slots__`"],
          answer: 1,
          explanation: "Forward the dunders you need explicitly when delegating.",
        },
        {
          prompt: "What does `types.SimpleNamespace(**d)` give?",
          options: ["A dict", "A plain object with the dict's keys as attributes and a readable repr", "A dataclass", "A frozen object"],
          answer: 1,
          explanation: "It is the ready-made attribute bag for the dict-as-attributes need.",
        },
      ],
    },
    {
      slug: "classes-as-objects",
      file: "05-classes-as-objects.md",
      exercises: [
        {
          title: "A registry of dynamic plugins",
          prompt: `\`Plugin\` keeps a class-level \`registry\` and an \`__init_subclass__(cls, *, key=None, **kwargs)\` that registers each subclass under \`key\` (default: the class name lower-cased), raising \`TypeError("duplicate key <k>")\` for a repeat. Commands: \`plugin Name [key]\` creates a subclass **at run time** with \`type(Name, (Plugin,), {}, key=key)\` (print the error message on a duplicate); \`list\` prints \`key=ClassName\` pairs in registration order; \`is Name\` prints whether the named class is a subclass of \`Plugin\`.

**Input:** commands.
**Output:** the results of \`list\`, \`is\` and failed \`plugin\` commands.

\`\`\`text
plugin CsvExport csv
plugin JsonExport
plugin Other csv
list
is JsonExport
\`\`\`
prints
\`\`\`text
duplicate key csv
csv=CsvExport jsonexport=JsonExport
True
\`\`\``,
          starter: String.raw`import sys


class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, *, key=None, **kwargs):
        # TODO
        super().__init_subclass__(**kwargs)


created = {}
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: plugin / list / is
`,
          solution: String.raw`import sys


class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, *, key=None, **kwargs):
        super().__init_subclass__(**kwargs)
        key = key or cls.__name__.lower()
        if key in Plugin.registry:
            raise TypeError(f"duplicate key {key}")
        Plugin.registry[key] = cls


created = {}
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "plugin":
        name = args[0]
        key = args[1] if len(args) > 1 else None
        try:
            created[name] = type(name, (Plugin,), {}, key=key)
        except TypeError as e:
            print(e)
    elif cmd == "list":
        print(" ".join(f"{k}={v.__name__}" for k, v in Plugin.registry.items()))
    elif cmd == "is":
        print(issubclass(created[args[0]], Plugin))
`,
          hints: [
            "`type(name, bases, namespace, **kwargs)` passes the keywords on to `__init_subclass__`.",
            "Register only after the duplicate check, so a rejected class leaves the registry untouched.",
          ],
          cases: [
            { stdin: "plugin CsvExport csv\nplugin JsonExport\nplugin Other csv\nlist\nis JsonExport\n", expected: "duplicate key csv\ncsv=CsvExport jsonexport=JsonExport\nTrue\n" },
            { stdin: "list\nplugin A\nplugin A\nlist\n", expected: "\nduplicate key a\na=A\n", hidden: true },
          ],
        },
        {
          title: "__new__: a singleton and an immutable subclass",
          prompt: `Write \`Registry\` whose \`__new__\` returns one shared instance (created on first use) and \`Celsius(float)\` whose \`__new__\` builds the float and whose \`fahrenheit\` property converts. Commands: \`registry\` creates two registries and prints whether they are the same object; \`celsius x\` prints \`<x> C = <f> F\` with one decimal and whether the value is an instance of \`float\`; \`init-count\` prints how many times \`Registry.__init__\` has run in total (a class counter — note it runs on every construction even though \`__new__\` returns the same object).

**Input:** commands.
**Output:** one line per command.

\`\`\`text
registry
celsius 100
init-count
\`\`\`
prints
\`\`\`text
same True
100.0 C = 212.0 F float True
inits 2
\`\`\``,
          starter: String.raw`import sys


class Registry:
    _instance = None
    inits = 0

    # TODO: __new__ returning the shared instance; __init__ counting

    def __init__(self):
        type(self).inits += 1


class Celsius(float):
    # TODO: __new__ and the fahrenheit property
    pass


for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Registry:
    _instance = None
    inits = 0

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        type(self).inits += 1


class Celsius(float):
    def __new__(cls, value):
        return super().__new__(cls, value)

    @property
    def fahrenheit(self):
        return self * 9 / 5 + 32


for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "registry":
        a, b = Registry(), Registry()
        print(f"same {a is b}")
    elif cmd == "celsius":
        c = Celsius(float(args[0]))
        print(f"{c:.1f} C = {c.fahrenheit:.1f} F float {isinstance(c, float)}")
    elif cmd == "init-count":
        print(f"inits {Registry.inits}")
`,
          hints: [
            "`__new__` is a static method receiving the class; `super().__new__(cls)` allocates a plain instance.",
            "When `__new__` returns an instance of `cls`, `__init__` still runs on it — which is why the singleton's counter climbs.",
          ],
          cases: [
            { stdin: "registry\ncelsius 100\ninit-count\n", expected: "same True\n100.0 C = 212.0 F float True\ninits 2\n" },
            { stdin: "celsius -40\nregistry\nregistry\ninit-count\n", expected: "-40.0 C = -40.0 F float True\nsame True\nsame True\ninits 4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `type(type)`?",
          options: ["`object`", "`type` — it is its own class", "`NoneType`", "`class`"],
          answer: 1,
          explanation: "`type` is the metaclass of every ordinary class, including itself.",
        },
        {
          prompt: "What does `type(\"Cat\", (object,), {\"legs\": 4})` return?",
          options: ["An instance with 4 legs", "A new class named `Cat` with a class attribute `legs`", "A tuple", "A dict"],
          answer: 1,
          explanation: "The `class` statement is a call to `type` with the name, bases and the body's namespace.",
        },
        {
          prompt: "When does `__init__` *not* run after `__new__`?",
          options: ["Never", "When `__new__` returns an object that is not an instance of the class", "When the class has `__slots__`", "When `__new__` is inherited"],
          answer: 1,
          explanation: "For a singleton that returns the same instance, `__init__` runs every time — a common surprise.",
        },
        {
          prompt: "What is `__init_subclass__` for?",
          options: ["Initialising instances", "Running code on the base class each time a subclass is defined — registries and validation", "Replacing `__init__`", "Creating metaclasses"],
          answer: 1,
          explanation: "It replaces most reasons anyone wrote a metaclass.",
        },
        {
          prompt: "When is a metaclass justified?",
          options: ["Whenever a class needs registering", "Only when the class namespace itself must be rewritten as the class is created and `__init_subclass__` or a decorator cannot do it", "For every base class", "Never"],
          answer: 1,
          explanation: "Frameworks (ORMs, `enum`, `abc`) use them; applications almost never need to.",
        },
      ],
    },
    {
      slug: "the-data-model",
      file: "06-the-data-model.md",
      exercises: [
        {
          title: "Vector arithmetic",
          prompt: `Implement \`Vector(*xs)\` with \`__repr__\` (\`Vector(1, 2)\` using \`:g\`), \`__len__\`, \`__iter__\`, \`__eq__\`, \`__add__\`, \`__mul__\` and \`__rmul__\` (scalar), \`__matmul__\` (dot product), \`__neg__\`, \`__abs__\` and \`__format__\` (applying the spec to each component inside parentheses). Binary operators return \`NotImplemented\` for foreign operands. Read \`v\` and \`w\` as two lines of numbers, then commands \`add\`, \`dot\`, \`scale k\`, \`rscale k\` (\`k * v\`), \`neg\`, \`abs\`, \`eq\`, \`fmt <spec>\`, and \`bad\` (which evaluates \`v + 1\` and prints the exception type name).

**Input:** two lines of numbers, then commands.
**Output:** one line per command.

\`\`\`text
1 2
3 4
add
dot
rscale 3
fmt .1f
bad
\`\`\`
prints
\`\`\`text
Vector(4, 6)
11
Vector(3, 6)
(1.0, 2.0)
TypeError
\`\`\``,
          starter: String.raw`import math
import sys


class Vector:
    def __init__(self, *xs):
        self._xs = tuple(float(x) for x in xs)

    # TODO: the dunders


v = Vector(*map(float, input().split()))
w = Vector(*map(float, input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import math
import sys


class Vector:
    def __init__(self, *xs):
        self._xs = tuple(float(x) for x in xs)

    def __repr__(self):
        return f"Vector({', '.join(f'{x:g}' for x in self._xs)})"

    def __len__(self):
        return len(self._xs)

    def __iter__(self):
        return iter(self._xs)

    def __eq__(self, other):
        return isinstance(other, Vector) and self._xs == other._xs

    def __add__(self, other):
        if not isinstance(other, Vector) or len(other) != len(self):
            return NotImplemented
        return Vector(*(a + b for a, b in zip(self, other)))

    def __mul__(self, k):
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vector(*(x * k for x in self._xs))

    __rmul__ = __mul__

    def __matmul__(self, other):
        if not isinstance(other, Vector) or len(other) != len(self):
            return NotImplemented
        return sum(a * b for a, b in zip(self, other))

    def __neg__(self):
        return Vector(*(-x for x in self._xs))

    def __abs__(self):
        return math.hypot(*self._xs)

    def __format__(self, spec):
        return f"({', '.join(format(x, spec) for x in self._xs)})"


v = Vector(*map(float, input().split()))
w = Vector(*map(float, input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "add":
        print(v + w)
    elif cmd == "dot":
        print(f"{v @ w:g}")
    elif cmd == "scale":
        print(v * float(args[0]))
    elif cmd == "rscale":
        print(float(args[0]) * v)
    elif cmd == "neg":
        print(-v)
    elif cmd == "abs":
        print(f"{abs(v):.2f}")
    elif cmd == "eq":
        print(v == w)
    elif cmd == "fmt":
        print(f"{v:{args[0]}}")
    elif cmd == "bad":
        try:
            v + 1
        except TypeError as e:
            print(type(e).__name__)
`,
          hints: [
            "`__rmul__ = __mul__` makes `3 * v` work: `int.__mul__` returns `NotImplemented` and Python tries the reflected method.",
            "Returning `NotImplemented` from `__add__` for an `int` is what lets Python raise the standard `TypeError`.",
          ],
          cases: [
            { stdin: "1 2\n3 4\nadd\ndot\nrscale 3\nfmt .1f\nbad\n", expected: "Vector(4, 6)\n11\nVector(3, 6)\n(1.0, 2.0)\nTypeError\n" },
            { stdin: "3 4\n3 4\neq\nabs\nneg\nscale 0.5\n", expected: "True\n5.00\nVector(-3, -4)\nVector(1.5, 2)\n", hidden: true },
            { stdin: "1 0 0\n0 1 0\ndot\nadd\neq\n", expected: "0\nVector(1, 1, 0)\nFalse\n", hidden: true },
          ],
        },
        {
          title: "A grid with tuple keys and a forgiving dict",
          prompt: `Write \`Grid(rows, cols)\` storing cells in a flat list with \`__getitem__\`/\`__setitem__\` taking a \`(r, c)\` tuple (\`IndexError\` when out of range) and \`__contains__\` testing whether a value is stored anywhere; and \`Defaults(dict)\` with a \`__missing__\` returning \`<key>\` in angle brackets without inserting it. Commands: \`set r c v\`, \`get r c\` (print value or \`out of range\`), \`has v\`, \`lookup k\` (on a \`Defaults\` built from the first line's pairs), \`size\` (the dict's length, to show \`__missing__\` inserted nothing).

**Input:** a line of \`key=value\` pairs, then \`R C\`, then commands.
**Output:** one line per query.

\`\`\`text
a=1
2 2
set 0 1 7
get 0 1
get 5 5
has 7
lookup a
lookup z
size
\`\`\`
prints
\`\`\`text
7
out of range
True
1
<z>
1
\`\`\``,
          starter: String.raw`import sys


class Grid:
    def __init__(self, rows, cols):
        self.rows, self.cols = rows, cols
        self._cells = [0] * (rows * cols)

    # TODO: __getitem__, __setitem__, __contains__ with (r, c) keys


class Defaults(dict):
    # TODO: __missing__
    pass


defaults = Defaults(tok.split("=", 1) for tok in input().split())
rows, cols = map(int, input().split())
grid = Grid(rows, cols)
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Grid:
    def __init__(self, rows, cols):
        self.rows, self.cols = rows, cols
        self._cells = [0] * (rows * cols)

    def _index(self, key):
        r, c = key
        if not (0 <= r < self.rows and 0 <= c < self.cols):
            raise IndexError(key)
        return r * self.cols + c

    def __getitem__(self, key):
        return self._cells[self._index(key)]

    def __setitem__(self, key, value):
        self._cells[self._index(key)] = value

    def __contains__(self, value):
        return value in self._cells


class Defaults(dict):
    def __missing__(self, key):
        return f"<{key}>"


defaults = Defaults(tok.split("=", 1) for tok in input().split())
rows, cols = map(int, input().split())
grid = Grid(rows, cols)
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "set":
        grid[int(args[0]), int(args[1])] = int(args[2])
    elif cmd == "get":
        try:
            print(grid[int(args[0]), int(args[1])])
        except IndexError:
            print("out of range")
    elif cmd == "has":
        print(int(args[0]) in grid)
    elif cmd == "lookup":
        print(defaults[args[0]])
    elif cmd == "size":
        print(len(defaults))
`,
          hints: [
            "`grid[r, c]` passes the tuple `(r, c)` as one key; unpack it in `__getitem__`.",
            "`__missing__` is called by `dict.__getitem__` only; returning a value without storing it leaves `len` unchanged.",
          ],
          cases: [
            { stdin: "a=1\n2 2\nset 0 1 7\nget 0 1\nget 5 5\nhas 7\nlookup a\nlookup z\nsize\n", expected: "7\nout of range\nTrue\n1\n<z>\n1\n" },
            { stdin: "\n1 1\nget 0 0\nhas 3\nset 0 0 3\nhas 3\nlookup q\nsize\n", expected: "0\nFalse\nTrue\n<q>\n0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "For `a + b`, what does Python try after `a.__add__(b)` returns `NotImplemented`?",
          options: ["Raises `TypeError` immediately", "`b.__radd__(a)`", "`a.__iadd__(b)`", "`b.__add__(a)`"],
          answer: 1,
          explanation: "The reflected method gets a chance; only if both decline is `TypeError` raised.",
        },
        {
          prompt: "What must `__iadd__` return?",
          options: ["`None`", "`self` (after mutating)", "A new object", "`NotImplemented` always"],
          answer: 1,
          explanation: "`a += b` rebinds `a` to whatever `__iadd__` returns.",
        },
        {
          prompt: "What does `g[1, 2]` pass to `__getitem__`?",
          options: ["Two arguments", "The tuple `(1, 2)` as one key", "A slice", "`1` only"],
          answer: 1,
          explanation: "Commas in a subscript build a tuple; NumPy indexing works this way.",
        },
        {
          prompt: "Which dict operation calls `__missing__`?",
          options: ["`d.get(k)`", "`d[k]` for an absent key", "`k in d`", "`d.setdefault(k)`"],
          answer: 1,
          explanation: "Only subscripting; `get`, `in` and `setdefault` bypass it.",
        },
        {
          prompt: "Why is `__del__` not a reliable place to release a resource?",
          options: ["It is never called", "It runs only when the last reference disappears, which cycles and shutdown can delay or skip; use `with` or `close`", "It cannot access `self`", "It raises on error"],
          answer: 1,
          explanation: "Deterministic cleanup belongs to context managers; `weakref.finalize` is the fallback.",
        },
      ],
    },
    {
      slug: "metaprogramming-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Stacked both ways",
          prompt: `Write \`traced\` (prints \`call <name>(<n>)\` on each invocation) and \`memoized\` (caches by argument), both with \`@wraps\`. Define \`fib\` twice: \`fib_a\` as \`@traced\` over \`@memoized\`, and \`fib_b\` as \`@memoized\` over \`@traced\`; each computes Fibonacci recursively through its own decorated name. Read \`n\`; call \`fib_a(n)\`, count the trace lines it printed, then \`fib_b(n)\`, count again, and print \`a traced <x>\`, \`b traced <y>\`, \`result <fib(n)>\`. (Capture the traces with \`contextlib.redirect_stdout\` into a \`StringIO\` and count its lines.)

**Input:** \`n\`.
**Output:** three lines.

\`\`\`text
5
\`\`\`
prints
\`\`\`text
a traced 9
b traced 6
result 5
\`\`\``,
          starter: String.raw`import contextlib
import io
from functools import wraps


def traced(fn):
    # TODO
    return fn


def memoized(fn):
    # TODO
    return fn


@traced
@memoized
def fib_a(n):
    return n if n < 2 else fib_a(n - 1) + fib_a(n - 2)


@memoized
@traced
def fib_b(n):
    return n if n < 2 else fib_b(n - 1) + fib_b(n - 2)


def count_traces(fn, n):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        result = fn(n)
    return result, len(buf.getvalue().splitlines())


n = int(input())
# TODO
`,
          solution: String.raw`import contextlib
import io
from functools import wraps


def traced(fn):
    @wraps(fn)
    def wrapper(n):
        print(f"call {fn.__name__}({n})")
        return fn(n)
    return wrapper


def memoized(fn):
    cache = {}

    @wraps(fn)
    def wrapper(n):
        if n not in cache:
            cache[n] = fn(n)
        return cache[n]
    return wrapper


@traced
@memoized
def fib_a(n):
    return n if n < 2 else fib_a(n - 1) + fib_a(n - 2)


@memoized
@traced
def fib_b(n):
    return n if n < 2 else fib_b(n - 1) + fib_b(n - 2)


def count_traces(fn, n):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        result = fn(n)
    return result, len(buf.getvalue().splitlines())


n = int(input())
result_a, traces_a = count_traces(fib_a, n)
result_b, traces_b = count_traces(fib_b, n)
print(f"a traced {traces_a}")
print(f"b traced {traces_b}")
print(f"result {result_a}")
`,
          hints: [
            "With `traced` outermost every call — including cache hits — is traced; with `memoized` outermost only cache misses reach `traced`.",
            "Each recursive call goes through the decorated name, so the wrappers see the whole tree.",
          ],
          cases: [
            { stdin: "5\n", expected: "a traced 9\nb traced 6\nresult 5\n" },
            { stdin: "1\n", expected: "a traced 1\nb traced 1\nresult 1\n", hidden: true },
            { stdin: "10\n", expected: "a traced 19\nb traced 11\nresult 55\n", hidden: true },
          ],
        },
        {
          title: "A small validation framework",
          prompt: `Build \`Field\`, a descriptor with \`__set_name__\`, \`__get__\` and \`__set__\` that checks \`isinstance(value, self.kind)\` and raises \`TypeError("<name> expects <kind>, got <type>")\`; and \`Model\`, whose \`__init_subclass__\` records the subclass's \`Field\` attributes in \`cls.fields\` (names in definition order) and whose \`__init__(**kwargs)\` assigns each field from the keywords (missing → \`TypeError("missing <name>")\`). Two models are given: \`User(name=str, age=int)\` and \`Point(x=float, y=float)\`. Commands: \`new Model k=v …\` (values parsed with \`ast.literal_eval\`; print \`ok <repr>\` or the error message) and \`fields Model\`.

**Input:** commands.
**Output:** one line per command.

\`\`\`text
fields User
new User name="ada" age=36
new User name="bob" age="x"
new Point x=1.5
\`\`\`
prints
\`\`\`text
name age
ok User(name='ada', age=36)
age expects int, got str
missing y
\`\`\``,
          starter: String.raw`import ast
import sys


class Field:
    def __init__(self, kind):
        self.kind = kind

    # TODO: __set_name__, __get__, __set__


class Model:
    fields: tuple[str, ...] = ()

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # TODO: collect Field names from the class namespace

    def __init__(self, **kwargs):
        # TODO
        pass

    def __repr__(self):
        inner = ", ".join(f"{f}={getattr(self, f)!r}" for f in self.fields)
        return f"{type(self).__name__}({inner})"


class User(Model):
    name = Field(str)
    age = Field(int)


class Point(Model):
    x = Field(float)
    y = Field(float)


MODELS = {"User": User, "Point": Point}
for line in sys.stdin:
    cmd, model, *pairs = line.split()
    # TODO
`,
          solution: String.raw`import ast
import sys


class Field:
    def __init__(self, kind):
        self.kind = kind

    def __set_name__(self, owner, name):
        self.name = name
        self.storage = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.storage)

    def __set__(self, obj, value):
        if not isinstance(value, self.kind):
            raise TypeError(f"{self.name} expects {self.kind.__name__}, got {type(value).__name__}")
        setattr(obj, self.storage, value)


class Model:
    fields: tuple[str, ...] = ()

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.fields = tuple(k for k, v in cls.__dict__.items() if isinstance(v, Field))

    def __init__(self, **kwargs):
        for name in self.fields:
            if name not in kwargs:
                raise TypeError(f"missing {name}")
            setattr(self, name, kwargs[name])

    def __repr__(self):
        inner = ", ".join(f"{f}={getattr(self, f)!r}" for f in self.fields)
        return f"{type(self).__name__}({inner})"


class User(Model):
    name = Field(str)
    age = Field(int)


class Point(Model):
    x = Field(float)
    y = Field(float)


MODELS = {"User": User, "Point": Point}
for line in sys.stdin:
    cmd, model, *pairs = line.split()
    cls = MODELS[model]
    if cmd == "fields":
        print(" ".join(cls.fields))
    elif cmd == "new":
        kwargs = {k: ast.literal_eval(v) for k, v in (p.split("=", 1) for p in pairs)}
        try:
            print(f"ok {cls(**kwargs)!r}")
        except TypeError as e:
            print(e)
`,
          hints: [
            "`cls.__dict__` in `__init_subclass__` holds the subclass body's names in definition order — filter for `Field` instances.",
            "`setattr(self, name, value)` in `__init__` goes through the descriptor's `__set__`, so validation happens there.",
          ],
          cases: [
            { stdin: "fields User\nnew User name=\"ada\" age=36\nnew User name=\"bob\" age=\"x\"\nnew Point x=1.5\n", expected: "name age\nok User(name='ada', age=36)\nage expects int, got str\nmissing y\n" },
            { stdin: "fields Point\nnew Point x=1.0 y=2.0\nnew Point x=1 y=2.0\n", expected: "x y\nok Point(x=1.0, y=2.0)\nx expects float, got int\n", hidden: true },
          ],
        },
        {
          title: "The complete Vector",
          prompt: `Extend the \`Vector\` of lesson 6 with \`__getitem__\` (an int returns a component; a slice returns a \`Vector\`), \`__hash__\` consistent with \`__eq__\`, \`__bool__\` (any non-zero component), \`__sub__\`, and \`__iadd__\` that mutates in place and returns \`self\`. Read \`v\`, then commands: \`get i\`, \`slice a b\`, \`bool\`, \`sub x y …\` (prints \`v - Vector(...)\`), \`iadd x y …\` (applies \`+=\` and prints \`v\` and whether it is still the same object as before), \`hash-eq x y …\` (prints whether \`v == Vector(...)\` and whether their hashes agree).

**Input:** a line of numbers, then commands.
**Output:** one line per command.

\`\`\`text
1 2 3
get 0
slice 1 3
bool
sub 1 1 1
iadd 1 1 1
hash-eq 2 3 4
\`\`\`
prints
\`\`\`text
1.0
Vector(2, 3)
True
Vector(0, 1, 2)
Vector(2, 3, 4) same True
eq True hash True
\`\`\``,
          starter: String.raw`import math
import sys


class Vector:
    def __init__(self, *xs):
        self._xs = list(float(x) for x in xs)

    def __repr__(self):
        return f"Vector({', '.join(f'{x:g}' for x in self._xs)})"

    def __len__(self):
        return len(self._xs)

    def __iter__(self):
        return iter(self._xs)

    def __eq__(self, other):
        return isinstance(other, Vector) and self._xs == other._xs

    # TODO: __getitem__, __hash__, __bool__, __sub__, __iadd__


v = Vector(*map(float, input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    nums = [float(a) for a in args]
    # TODO
`,
          solution: String.raw`import math
import sys


class Vector:
    def __init__(self, *xs):
        self._xs = list(float(x) for x in xs)

    def __repr__(self):
        return f"Vector({', '.join(f'{x:g}' for x in self._xs)})"

    def __len__(self):
        return len(self._xs)

    def __iter__(self):
        return iter(self._xs)

    def __eq__(self, other):
        return isinstance(other, Vector) and self._xs == other._xs

    def __getitem__(self, i):
        if isinstance(i, slice):
            return Vector(*self._xs[i])
        return self._xs[i]

    def __hash__(self):
        return hash(tuple(self._xs))

    def __bool__(self):
        return any(self._xs)

    def __sub__(self, other):
        if not isinstance(other, Vector) or len(other) != len(self):
            return NotImplemented
        return Vector(*(a - b for a, b in zip(self, other)))

    def __iadd__(self, other):
        if not isinstance(other, Vector) or len(other) != len(self):
            return NotImplemented
        for i, b in enumerate(other):
            self._xs[i] += b
        return self


v = Vector(*map(float, input().split()))
for line in sys.stdin:
    cmd, *args = line.split()
    nums = [float(a) for a in args]
    if cmd == "get":
        print(v[int(args[0])])
    elif cmd == "slice":
        print(v[int(args[0]):int(args[1])])
    elif cmd == "bool":
        print(bool(v))
    elif cmd == "sub":
        print(v - Vector(*nums))
    elif cmd == "iadd":
        before = v
        v += Vector(*nums)
        print(f"{v} same {v is before}")
    elif cmd == "hash-eq":
        other = Vector(*nums)
        print(f"eq {v == other} hash {hash(v) == hash(other)}")
`,
          hints: [
            "`__iadd__` changes the list in place and returns `self`, so `v += …` keeps the same object.",
            "Hash the tuple of components so that equal vectors hash equal (a list is unhashable).",
          ],
          cases: [
            { stdin: "1 2 3\nget 0\nslice 1 3\nbool\nsub 1 1 1\niadd 1 1 1\nhash-eq 2 3 4\n", expected: "1.0\nVector(2, 3)\nTrue\nVector(0, 1, 2)\nVector(2, 3, 4) same True\neq True hash True\n" },
            { stdin: "0 0\nbool\niadd 0 0\nbool\nhash-eq 0 1\n", expected: "False\nVector(0, 0) same True\nFalse\neq False hash False\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "When does the decorator function itself run?",
          options: ["On every call", "Once, when the `def` is executed", "At import of `functools`", "Never"],
          answer: 1,
          explanation: "The wrapper it returns is what runs on each call.",
        },
        {
          prompt: "What does `functools.wraps` set on the wrapper?",
          options: ["Only `__name__`", "`__name__`, `__doc__`, `__qualname__`, `__module__` and `__wrapped__`", "The call count", "The signature only"],
          answer: 1,
          explanation: "`__wrapped__` lets tests and tools reach the original.",
        },
        {
          prompt: "Why do closures in a loop all return the final loop value?",
          options: ["A compiler bug", "They share one cell for the loop variable, read when called", "Lambdas cannot capture", "The loop copies the value"],
          answer: 1,
          explanation: "Late binding: bind per iteration with a default argument or a factory.",
        },
        {
          prompt: "Which method makes a descriptor a *data* descriptor?",
          options: ["`__get__`", "`__set__` or `__delete__`", "`__set_name__`", "`__init__`"],
          answer: 1,
          explanation: "Data descriptors take priority over the instance dict.",
        },
        {
          prompt: "Where should a descriptor store per-instance values?",
          options: ["On the descriptor", "On the instance, under a private name", "In a global dict", "In the class"],
          answer: 1,
          explanation: "The descriptor object is shared by every instance of the class.",
        },
        {
          prompt: "What does `object.__setattr__(self, name, value)` do inside a custom `__setattr__`?",
          options: ["Nothing", "Performs the real assignment without re-entering the custom hook", "Raises", "Calls `__getattr__`"],
          answer: 1,
          explanation: "It is the way to avoid infinite recursion in write hooks.",
        },
        {
          prompt: "What is `hasattr(obj, \"x\")` implemented as?",
          options: ["A dict lookup", "`getattr` inside a `try`, returning `False` on `AttributeError`", "`\"x\" in dir(obj)`", "A metaclass call"],
          answer: 1,
          explanation: "That is why `__getattr__` must raise `AttributeError` rather than return `None`.",
        },
        {
          prompt: "What does `type(name, bases, ns)` need to be told keyword arguments for?",
          options: ["Nothing", "They are forwarded to `__init_subclass__` of the bases", "The metaclass name", "Instance defaults"],
          answer: 1,
          explanation: "`class X(Base, key=\"csv\")` and `type(\"X\", (Base,), {}, key=\"csv\")` are equivalent.",
        },
        {
          prompt: "What does returning `NotImplemented` from `__eq__` cause?",
          options: ["A `TypeError`", "Python tries the reflected comparison and finally falls back to identity", "`False`", "`None`"],
          answer: 1,
          explanation: "It is the cooperative signal; raising would break the protocol.",
        },
        {
          prompt: "Which pair must agree for an object to be a set member?",
          options: ["`__repr__` and `__str__`", "`__eq__` and `__hash__`", "`__lt__` and `__gt__`", "`__len__` and `__bool__`"],
          answer: 1,
          explanation: "Equal objects must hash equal; defining `__eq__` alone removes the hash.",
        },
        {
          prompt: "What is `v[1:3]` if `__getitem__` receives a `slice` and returns `Vector(*self._xs[i])`?",
          options: ["A list", "A `Vector` of the two components", "A tuple", "`IndexError`"],
          answer: 1,
          explanation: "Handling `slice` explicitly is what keeps slicing inside the type.",
        },
        {
          prompt: "Which tool should register subclasses without a metaclass?",
          options: ["`__new__`", "`__init_subclass__`", "`__getattr__`", "`__call__`"],
          answer: 1,
          explanation: "It runs on the base for each new subclass and can take class-statement keywords.",
        },
      ],
    },
  ],
});
