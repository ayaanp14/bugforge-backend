---
skill: python
level: intermediate
---

## python-intermediate-051
topic: functions
answer: B

```python
def total(a, b):
    return a + b

params = {"a": 1, "b": 2}
total(5, **params)
```

What happens on the last line?

- A: It returns `7`; the keyword `a=1` is ignored.
- B: It raises `TypeError`: `total()` got multiple values for `a`.
- C: It returns `3`; the positional `5` is ignored.
- D: It raises `TypeError`: `total()` got too many positional arguments.

> `**params` expands to `a=1, b=2`. The positional `5` has already filled `a`, so
> the call supplies `a` twice, and Python raises `TypeError: total() got multiple
> values for argument 'a'`. There is only one positional argument, so it is not a
> "too many positional arguments" error, and neither value is silently dropped.

## python-intermediate-052
topic: scope-closures
answer: D
run: python

What does this program print?

```python
i = "outer"
squares = [i * i for i in range(4)]
for j in range(3):
    pass
print(i, squares[-1], j)
```

- A: `3 9 2`
- B: `outer 9 3`
- C: It raises a `NameError`, because `j` does not exist after the loop.
- D: `outer 9 2`

> In Python 3 a comprehension's loop variable is local to the comprehension, so
> the outer `i` is untouched. A plain `for` loop has no scope of its own: `j`
> stays bound after the loop to the last value it took, `2`.

## python-intermediate-053
topic: oop
answer: A
run: python

What does this program print?

```python
class Shape:
    @classmethod
    def create(cls):
        return cls()

    @staticmethod
    def kind():
        return "shape"

    def describe(self):
        return Shape.kind() + "/" + self.kind()

class Square(Shape):
    @staticmethod
    def kind():
        return "square"

s = Square.create()
print(type(s).__name__, s.describe())
```

- A: `Square shape/square`
- B: `Shape shape/shape`
- C: `Shape shape/square`
- D: `Square square/square`

> A classmethod receives the class it was called on, so `Square.create()` builds
> a `Square`. Static methods are still looked up through normal attribute
> resolution: `self.kind()` finds `Square.kind`, while `Shape.kind()` names the
> base class explicitly.

## python-intermediate-054
topic: iterators
answer: C
run: python

What does this program print?

```python
class Tag:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        return self.name.lower() == other.name.lower()

    def __hash__(self):
        return hash(self.name.lower())

tags = {Tag("Py"), Tag("py"), Tag("PY"), Tag("js")}
print(len(tags), Tag("JS") in tags)
```

- A: `4 False`
- B: `3 True`
- C: `2 True`
- D: `2 False`

> A set treats two objects as the same element when their hashes match and `__eq__`
> says they are equal. Both methods here ignore case, so the three spellings of
> `py` collapse into one element, and a new `Tag("JS")` is found because it hashes
> and compares like `Tag("js")`.

## python-intermediate-055
topic: comprehensions
answer: B
run: python

What does this program print?

```python
words = ["apple", "banana", "cherry", "avocado", "blueberry"]
first = {w[0]: w for w in words}
print(first)
```

- A: `{'a': 'apple', 'b': 'banana', 'c': 'cherry'}`
- B: `{'a': 'avocado', 'b': 'blueberry', 'c': 'cherry'}`
- C: `{'c': 'cherry', 'a': 'avocado', 'b': 'blueberry'}`
- D: `{'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}`

> A dict comprehension assigns key by key, so a repeated key is overwritten and the
> last value wins. Overwriting an existing key keeps its original position in the
> dict's insertion order; it does not move to the end.

## python-intermediate-056
topic: decorators
answer: D
run: python

What does this program print?

```python
def repeat(n):
    def deco(func):
        def wrapper(*args):
            return [func(*args) for _ in range(n)]
        return wrapper
    return deco

@repeat
def greet(name):
    return name.upper()

result = greet("ok")
print(type(result).__name__)
```

- A: `list`
- B: `str`
- C: It raises a `TypeError`.
- D: `function`

> `repeat` is a decorator factory and needs to be called: `@repeat(3)`. Written as
> `@repeat`, it receives the function as `n` and returns `deco`, so `greet` now
> names `deco`. Calling `greet("ok")` runs `deco` with `func="ok"`, which just
> builds and returns `wrapper` without calling anything, so no error occurs.

## python-intermediate-057
topic: stdlib
answer: A
run: python

What does this program print?

```python
from functools import reduce

print(reduce(lambda acc, d: acc * 10 + d, [1, 2, 3], 4))
```

- A: `4123`
- B: `1234`
- C: `123`
- D: `10`

> The third argument is the initializer: it becomes the first `acc`, and every
> list item is then folded in from left to right. 4 becomes 41, then 412, then
> 4123. Without an initializer the fold would start from the first item and give
> 123.

## python-intermediate-058
topic: exceptions
answer: C
run: python

What does this program print?

```python
class AppError(Exception):
    pass

class NotFound(AppError):
    pass

def handle(exc):
    try:
        raise exc
    except AppError:
        return "app"
    except NotFound:
        return "not found"
    except Exception:
        return "other"

print(handle(NotFound()), handle(KeyError()), isinstance(NotFound(), Exception))
```

- A: `not found other True`
- B: `app app True`
- C: `app other True`
- D: `not found other False`

> `except` clauses are tried top to bottom and the first one that matches wins,
> and a clause matches subclasses too. `NotFound` is an `AppError`, so the first
> clause catches it and the `NotFound` clause can never run. `KeyError` matches
> only `Exception`. Custom exceptions derived from `Exception` are instances of
> it.

## python-intermediate-059
topic: dicts-sets
answer: B

```python
stock = {"apple": 0, "pear": 3}
for name in stock:
    if stock[name] == 0:
        stock["plum"] = 5
```

What happens when this runs?

- A: The loop visits `apple` and `pear`; `stock` ends with three keys.
- B: It raises `RuntimeError` after the first pass.
- C: The loop visits all three keys, including `plum`.
- D: It raises `KeyError` when `plum` is added.

> Adding or removing keys while iterating over a dict is detected: the first pass
> (`apple`) adds `plum`, and the iterator's next step raises `RuntimeError:
> dictionary changed size during iteration`. Iterate over `list(stock)` to change
> the dict safely inside the loop.

## python-intermediate-060
topic: lists-tuples
answer: D
run: python

What does this program print?

```python
a = [1, 2]
b = a
a += [3]
c = a
a = a + [4]
print(b, c is b, a)
```

- A: `[1, 2] True [1, 2, 3, 4]`
- B: `[1, 2, 3, 4] True [1, 2, 3, 4]`
- C: `[1, 2, 3] False [1, 2, 3, 4]`
- D: `[1, 2, 3] True [1, 2, 3, 4]`

> For a list, `+=` extends the existing object in place, so `b` (the same object)
> sees the `3`, and `c` still names that same object. `a + [4]` builds a new list
> and rebinds only `a`, leaving `b` and `c` behind.

## python-intermediate-061
topic: functions
answer: A
run: python

What does this program print?

```python
def join(*parts, sep=" "):
    return sep.join(parts)

print(repr(join("x", "y", "+")), repr(join("x", "y", sep="+")))
```

- A: `'x y +' 'x+y'`
- B: `'x+y' 'x+y'`
- C: `'x y' 'x+y'`
- D: It raises a `TypeError`.

> A parameter declared after `*parts` is keyword-only. Positional arguments never
> fill it, so in the first call `"+"` is collected into `parts` as a third string
> and joined with the default separator. Only `sep="+"` changes the separator.

## python-intermediate-062
topic: scope-closures
answer: C
run: python

What does this program print?

```python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        global x
        return x
    return inner()

print(outer())
```

- A: `enclosing`
- B: It raises a `SyntaxError`.
- C: `global`
- D: It raises a `NameError`.

> `global x` makes `x` in `inner` refer to the module-level name, skipping any
> enclosing function's variable of the same name. It is legal even though `outer`
> has its own local `x`; `nonlocal x` is what would have reached `"enclosing"`.

## python-intermediate-063
topic: oop
answer: B
run: python

What does this program print?

```python
class Money:
    radd_calls = 0

    def __init__(self, v):
        self.v = v

    def __add__(self, other):
        return Money(self.v + other.v)

    def __radd__(self, other):
        Money.radd_calls += 1
        return Money(self.v + other)

total = sum([Money(2), Money(3), Money(4)])
print(total.v, Money.radd_calls)
```

- A: It raises a `TypeError`.
- B: `9 1`
- C: `9 0`
- D: `9 3`

> `sum` starts from `0`, so its first step is `0 + Money(2)`. `int.__add__` cannot
> handle a `Money` and returns `NotImplemented`, so Python tries the right
> operand's `__radd__`, once. Every later step has a `Money` on the left and uses
> `__add__`.

## python-intermediate-064
topic: iterators
answer: A
run: python

What does this program print?

```python
class Seq:
    def __getitem__(self, i):
        if i >= 3:
            raise IndexError(i)
        return i * 10

print(list(Seq()), 20 in Seq())
```

- A: `[0, 10, 20] True`
- B: `[0, 10, 20] False`
- C: It raises a `TypeError`, because `Seq` has no `__iter__`.
- D: `[] False`

> When a class has no `__iter__`, `iter()` falls back to the old sequence
> protocol: it calls `__getitem__` with 0, 1, 2, ... until `IndexError`. `in`
> without `__contains__` iterates the same way, so it finds 20.

## python-intermediate-065
topic: comprehensions
answer: D
run: python

What does this program print?

```python
pairs = [(x, y) for x in range(3) for y in range(x)]
print(pairs)
```

- A: `[(0, 0), (1, 0), (1, 1)]`
- B: `[(0, 1), (0, 2), (1, 2)]`
- C: `[(1, 0), (2, 1)]`
- D: `[(1, 0), (2, 0), (2, 1)]`

> Multiple `for` clauses nest left to right, like nested loops: `x` is the outer
> loop and `y` the inner, which can use `x`. For `x = 0`, `range(0)` is empty; for
> `x = 1` it gives `y = 0`; for `x = 2` it gives 0 and 1.

## python-intermediate-066
topic: decorators
answer: C
run: python

What does this program print?

```python
from contextlib import contextmanager

@contextmanager
def step(name):
    print("start", name, end=" ")
    try:
        yield name.upper()
    finally:
        print("end", name, end=" ")

with step("a") as x, step("b") as y:
    print(x + y, end=" ")
print()
```

- A: `start a start b AB end a end b`
- B: `start a end a start b end b AB`
- C: `start a start b AB end b end a`
- D: `start a start b end b end a AB`

> With `@contextmanager`, the code before `yield` is the setup, the yielded value
> is bound by `as`, and the code after it runs on exit. Several managers in one
> `with` nest like separate `with` statements: entered left to right, exited in
> reverse order, after the body.

## python-intermediate-067
topic: stdlib
answer: B
run: python

What does this program print?

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

fib(10)
info = fib.cache_info()
print(info.hits, info.misses)
```

- A: `0 11`
- B: `8 11`
- C: `9 11`
- D: `0 177`

> The recursive calls go through the cached wrapper too. Each of `fib(0)` to
> `fib(10)` is computed once: 11 misses. Every `fib(n)` with n from 3 to 10 asks
> for `fib(n - 2)` after `fib(n - 1)` has already computed it, and each of those
> 8 lookups is a hit. (`fib(2)`'s call to `fib(0)` is the first, so it misses.)

## python-intermediate-068
topic: exceptions
answer: B, C, E

Which of these exceptions are *not* caught by `except Exception:`? Select all that apply.

- A: `StopIteration`
- B: `KeyboardInterrupt`
- C: `SystemExit`
- D: `ZeroDivisionError`
- E: `GeneratorExit`

> `KeyboardInterrupt`, `SystemExit` and `GeneratorExit` derive directly from
> `BaseException`, not `Exception`, so that a broad `except Exception` does not
> stop Ctrl+C, `sys.exit()` or generator cleanup. `StopIteration` and
> `ZeroDivisionError` are ordinary `Exception` subclasses.

## python-intermediate-069
topic: lists-tuples
answer: D

```python
a = [[1], [2]]
```

Which assignment gives a `b` for which `b[0].append(3)` leaves `a` unchanged?

- A: `b = a[:]`
- B: `b = list(a)`
- C: `b = a * 1`
- D: `b = [row[:] for row in a]`

> Slicing, `list()` and `* 1` all make shallow copies: a new outer list holding
> the same inner lists, so appending to `b[0]` changes `a[0]` too. Copying each
> row gives `b` its own inner lists. For deeper nesting, `copy.deepcopy` does the
> same at every level.

## python-intermediate-070
topic: scope-closures
answer: A
run: python

What does this program print?

```python
funcs = []
for i in range(3):
    funcs.append(lambda x, i=i: x * i)
i = 10
print([f(2) for f in funcs])
```

- A: `[0, 2, 4]`
- B: `[20, 20, 20]`
- C: `[4, 4, 4]`
- D: It raises a `TypeError`.

> `i=i` makes `i` a parameter whose default is evaluated when each lambda is
> created, capturing that iteration's value. The lambdas no longer read the
> global `i`, so rebinding it to 10 has no effect. Callers pass only `x`; `i` uses
> its default.

## python-intermediate-071
topic: oop
answer: C
run: python

What does this program print?

```python
class Point:
    def __repr__(self):
        return "R"

    def __str__(self):
        return "S"

p = Point()
print(p, [p], f"{p!r}")
```

- A: `S [S] R`
- B: `R [R] R`
- C: `S [R] R`
- D: `S [S] S`

> `print` calls `str()` on each argument, which uses `__str__`. A list's string
> form is built from the `repr()` of its items, so the point inside the list
> shows `R`. The `!r` conversion in an f-string asks for `repr()` explicitly.

## python-intermediate-072
topic: iterators
answer: B

A class defines `__iter__` as a generator function (its body uses `yield`) and does not define `__next__`. Which statement is true?

- A: `next(obj)` on an instance returns the first item the generator yields.
- B: Each `for` loop over the same instance starts a fresh pass.
- C: A second `for` loop over the same instance yields nothing.
- D: Instances cannot be used in a `for` loop without `__next__`.

> Calling a generator function returns a new generator, so every `iter(obj)`
> (which each `for` loop does) gets a fresh iterator and a fresh pass. The
> instance itself is iterable but not an iterator: it has no `__next__`, so
> `next(obj)` raises `TypeError`.

## python-intermediate-073
topic: comprehensions
answer: D
run: python

What does this program print?

```python
calls = []

def check(n):
    calls.append(n)
    return n > 2

print(any(check(n) for n in [1, 3, 5, 0]), calls)
```

- A: `True [1, 3, 5, 0]`
- B: `True []`
- C: `True [3]`
- D: `True [1, 3]`

> A generator expression produces values only as `any` asks for them, and `any`
> stops at the first true result. `check` runs for 1 (false) and 3 (true), then
> nothing more is consumed. With a list comprehension, `[check(n) for n in ...]`,
> every call would happen before `any` started.

## python-intermediate-074
topic: decorators
answer: A
run: python

What does this program print?

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.calls = 0

    def __call__(self, *args):
        self.calls += 1
        return self.func(*args)

@CountCalls
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

fib(5)
print(fib.calls)
```

- A: `15`
- B: `1`
- C: `6`
- D: `5`

> After decoration the global name `fib` refers to the `CountCalls` instance, and
> the function body looks `fib` up by that name, so every recursive call also
> goes through `__call__`. Naive recursion makes 1 + calls(n-1) + calls(n-2)
> calls: 1, 1, 3, 5, 9, 15 for n = 0 to 5.

## python-intermediate-075
topic: stdlib
answer: C

`counts` is a dict that maps words to counts, in no particular insertion order. Which expression always lists its `(word, count)` pairs by count, highest first, with equal counts in alphabetical order of the word?

- A: `sorted(counts.items(), key=lambda kv: kv[1], reverse=True)`
- B: `sorted(counts.items(), key=lambda kv: (kv[1], kv[0]), reverse=True)`
- C: `sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))`
- D: `collections.Counter(counts).most_common()`

> Negating the count sorts it descending while the word, left as is, still sorts
> ascending as a tie-breaker. `reverse=True` on the tuple key reverses both parts,
> giving ties in reverse alphabetical order. Sorting on the count alone, and
> `most_common()`, leave ties in the dict's insertion order.
