---
skill: python
level: intermediate
---

## python-intermediate-026
topic: functions
answer: C
run: python

What does this program print?

```python
first, *middle, last = range(5)
head, *tail = "ab"
print(first, middle, last, tail)
```

- A: `0 (1, 2, 3) 4 ('b',)`
- B: `0 range(1, 4) 4 b`
- C: `0 [1, 2, 3] 4 ['b']`
- D: `0 [1, 2, 3] 4 b`

> The starred target in an unpacking assignment always collects the leftover
> items into a new list, whatever the type of the source: a `range` gives a list
> of ints and a string gives a list of one-character strings. Even a single
> leftover item is wrapped in a list.

## python-intermediate-027
topic: scope-closures
answer: A
run: python

What does this program print?

```python
x = "global"

class C:
    x = "class"
    y = x.upper()

    def get(self):
        return x, self.x

print(C.y, C().get())
```

- A: `CLASS ('global', 'class')`
- B: `CLASS ('class', 'class')`
- C: `GLOBAL ('global', 'class')`
- D: `GLOBAL ('global', 'global')`

> Code that runs directly in the class body sees the class's own names, so
> `y = x.upper()` uses `"class"`. But a class body is not an enclosing scope for
> the methods defined in it: inside `get`, a bare `x` skips the class and
> resolves to the global. Class attributes must be reached through `self` or the
> class.

## python-intermediate-028
topic: oop
answer: D
run: python

What does this program print?

```python
class Config:
    retries = 3

a = Config()
b = Config()
a.retries = 5
Config.retries = 7
before = a.retries
del a.retries
print(before, a.retries, b.retries)
```

- A: `5 3 7`
- B: `7 7 7`
- C: `5 3 3`
- D: `5 7 7`

> Assigning `a.retries` creates an instance attribute that shadows the class
> attribute for `a` only. Changing `Config.retries` is seen by every instance
> without its own value, such as `b`. Deleting the instance attribute removes the
> shadow, so `a.retries` falls back to the class's current value, `7`.

## python-intermediate-029
topic: iterators
answer: B
run: python

What does this program print?

```python
squares = map(lambda n: n * n, [1, 2, 3, 4])
print(4 in squares, list(squares))
```

- A: `True [1, 4, 9, 16]`
- B: `True [9, 16]`
- C: `True []`
- D: `False [1, 4, 9, 16]`

> `map` returns a one-shot iterator. `in` on an iterator consumes items until it
> finds a match: it reads `1`, then `4`, and stops. `list(squares)` then gets
> only what is left, `9` and `16`.

## python-intermediate-030
topic: comprehensions
answer: A
run: python

What does this program print?

```python
def inner():
    yield 1
    yield 2
    return "done"

def outer():
    result = yield from inner()
    yield result

print(list(outer()))
```

- A: `[1, 2, 'done']`
- B: `[1, 2]`
- C: `[1, 2, None]`
- D: `[[1, 2], 'done']`

> `yield from` passes each value of the inner generator straight through, one
> by one, and evaluates to the inner generator's `return` value once it finishes.
> So `outer` yields `1` and `2`, receives `"done"` as `result`, and yields that
> too.

## python-intermediate-031
topic: decorators
answer: C
run: python

What does this program print?

```python
def tag(label):
    print("make", label, end=" ")
    def deco(func):
        print("wrap", func.__name__, end=" ")
        return func
    return deco

@tag("x")
def job():
    print("run", end=" ")

print("start")
```

- A: `start`
- B: `start make x wrap job`
- C: `make x wrap job start`
- D: `make x wrap job run start`

> Decorators run when the `def` statement executes, not when the function is
> called. `@tag("x")` first calls `tag("x")`, then calls the returned `deco` with
> `job`, both before `print("start")`. `job` itself is never called, so `run`
> never prints.

## python-intermediate-032
topic: stdlib
answer: D
run: python

What does this program print?

```python
from collections import namedtuple

Point = namedtuple("Point", "x y")
p = Point(1, 2)
q = p._replace(x=5)
print(p.x, q, q == (5, 2))
```

- A: `5 Point(x=5, y=2) True`
- B: `1 Point(x=5, y=2) False`
- C: `1 (5, 2) True`
- D: `1 Point(x=5, y=2) True`

> Named tuples are immutable, so `_replace` returns a new instance and leaves `p`
> alone. A named tuple's repr shows the type and field names. It is still a
> tuple subclass, so it compares equal to a plain tuple with the same items.

## python-intermediate-033
topic: exceptions
answer: B
run: python

What does this program print?

```python
log = []

def save():
    try:
        log.append("try")
        raise KeyError("disk")
    except ValueError:
        log.append("except")
    finally:
        log.append("finally")
        return "saved"

try:
    result = save()
except KeyError:
    result = "failed"
print(result, log)
```

- A: `failed ['try', 'finally']`
- B: `saved ['try', 'finally']`
- C: `saved ['try', 'except', 'finally']`
- D: `failed ['try']`

> The `KeyError` does not match `except ValueError`, so it is pending when
> `finally` runs. A `return` inside `finally` replaces the pending exception: it
> is discarded and the function returns normally. That is why `return` in
> `finally` is considered a bug magnet: it silently swallows errors.

## python-intermediate-034
topic: dicts-sets
answer: C
run: python

What does this program print?

```python
d = {"a": 1, "b": 2}
keys = d.keys()
d["c"] = 3
del d["a"]
print(list(keys), len(keys))
```

- A: `['a', 'b'] 2`
- B: `['a', 'b', 'c'] 3`
- C: `['b', 'c'] 2`
- D: It raises a `RuntimeError`.

> `dict.keys()` returns a view, not a copy: it always reflects the dict's
> current contents. Changing the dict between creating the view and reading it is
> fine; only changing its size while iterating over it raises `RuntimeError`.

## python-intermediate-035
topic: lists-tuples
answer: A
run: python

What does this program print?

```python
t = (1, [2, 3])
try:
    t[1] += [4]
except TypeError:
    print("error", t)
else:
    print("ok", t)
```

- A: `error (1, [2, 3, 4])`
- B: `error (1, [2, 3])`
- C: `ok (1, [2, 3, 4])`

> `t[1] += [4]` runs in two steps: it calls the list's in-place `__iadd__`, which
> extends the list, and then assigns the result back to `t[1]`. The first step
> succeeds; the second fails because tuples do not support item assignment. So
> the `TypeError` is raised, but the list inside the tuple has already changed.

## python-intermediate-036
topic: functions
answer: B, D

```python
def f(a, b, /, c, *, d):
    return a + b + c + d
```

Which of these calls succeed? Select all that apply.

- A: `f(1, b=2, c=3, d=4)`
- B: `f(1, 2, 3, d=4)`
- C: `f(1, 2, 3, 4)`
- D: `f(1, 2, c=3, d=4)`
- E: `f(a=1, b=2, c=3, d=4)`

> Parameters before `/` are positional-only, so `a` and `b` cannot be passed by
> keyword (A and E fail). Parameters after `*` are keyword-only, so `d` cannot be
> passed positionally (C fails). `c` sits between the two markers and may be
> passed either way, so B and D both work.

## python-intermediate-037
topic: scope-closures
answer: B

```python
x = 0

def outer():
    def inner():
        nonlocal x
        x += 1
    inner()

outer()
```

What happens when this module runs?

- A: The global `x` becomes `1`.
- B: It raises `SyntaxError` before any of the code runs.
- C: It raises `UnboundLocalError` when `inner()` is called.
- D: It raises `NameError` when `inner()` is called.

> `nonlocal` only binds to a variable of an enclosing function; it never reaches
> module globals. `outer` has no `x`, so the compiler reports `SyntaxError: no
> binding for nonlocal 'x' found` when it compiles the module, before the first
> line executes. `global x` is what would update the module's `x`.

## python-intermediate-038
topic: oop
answer: D

```python
class A:
    pass

class B(A):
    pass

class C(A, B):
    pass
```

What happens when this code runs?

- A: `C.__mro__` is `(C, A, B, object)`.
- B: `C.__mro__` is `(C, B, A, object)`.
- C: `C.__mro__` is `(C, A, object)`; `B` is ignored.
- D: The `class C` statement raises `TypeError`.

> The C3 linearization must keep every class before its own bases and keep the
> listed base order. `C(A, B)` asks for `A` before `B`, but `B` is a subclass of
> `A` and must come before it. No order satisfies both, so creating the class
> raises `TypeError: Cannot create a consistent method resolution order (MRO)`.

## python-intermediate-039
topic: iterators
answer: C
run: python

What does this program print?

```python
class Countdown:
    def __init__(self, start):
        self.n = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.n == 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1

c = Countdown(3)
print(list(c), list(c))
```

- A: `[3, 2, 1] [3, 2, 1]`
- B: `[2, 1, 0] []`
- C: `[3, 2, 1] []`
- D: `[3, 2, 1, 0] []`

> `__next__` returns the value before the decrement, giving 3, 2, 1, and stops
> once `n` reaches 0. Because `__iter__` returns `self`, the object is its own
> iterator: the second `list(c)` gets the same exhausted object and collects
> nothing. Returning a fresh iterator from `__iter__` would make it reusable.

## python-intermediate-040
topic: comprehensions
answer: A
run: python

What does this program print?

```python
def averager():
    total = count = 0
    avg = None
    while True:
        value = yield avg
        total += value
        count += 1
        avg = total / count

g = averager()
next(g)
g.send(10)
print(g.send(20))
```

- A: `15.0`
- B: `15`
- C: `20.0`
- D: `10.0`

> `next(g)` runs to the first `yield` (priming the generator). Each `send(v)`
> resumes it with `yield` evaluating to `v`, runs to the next `yield`, and
> returns the value yielded there. After 10 and 20 the running average is
> 30 / 2, and `/` always produces a float in Python 3.

## python-intermediate-041
topic: decorators
answer: D

A context manager's `__exit__` method returns `None`, and the body of the `with` block raises `KeyError`. What happens?

- A: The `KeyError` is suppressed, because `__exit__` did not return `False`.
- B: The `KeyError` propagates, and `__exit__` is never called.
- C: `__exit__` is called with three `None` arguments, then the `KeyError` propagates.
- D: `__exit__` is called with the exception's details, then the `KeyError` propagates.

> `__exit__` always runs when the block is left, and when it is left by an
> exception it receives the type, the instance and the traceback. Only a truthy
> return value suppresses the exception; `None` is falsy, so the `KeyError`
> carries on after `__exit__` returns.

## python-intermediate-042
topic: stdlib
answer: B
run: python

What does this program print?

```python
from itertools import groupby

data = "aabbbaac"
print([(key, len(list(group))) for key, group in groupby(data)])
```

- A: `[('a', 4), ('b', 3), ('c', 1)]`
- B: `[('a', 2), ('b', 3), ('a', 2), ('c', 1)]`
- C: `[('a', 2), ('b', 3), ('c', 1)]`
- D: `['a', 'b', 'a', 'c']`

> `groupby` groups consecutive equal items only; it does not sort or merge
> groups that reappear later. The later run of `a` becomes its own group. To
> group all equal items, sort the data by the same key first.

## python-intermediate-043
topic: exceptions
answer: C
run: python

What does this program print?

```python
class ConfigError(Exception):
    pass

def read_port(cfg):
    try:
        return int(cfg["port"])
    except (KeyError, ValueError) as e:
        raise ConfigError("bad port") from e

for cfg in [{}, {"port": "x"}, {"port": "80"}]:
    try:
        print(read_port(cfg), end=" ")
    except ConfigError as e:
        print(type(e.__cause__).__name__, end=" ")
```

- A: `ConfigError ConfigError 80`
- B: `NoneType NoneType 80`
- C: `KeyError ValueError 80`
- D: `bad port bad port 80`

> `raise NewError(...) from e` sets the new exception's `__cause__` to `e`. The
> empty dict fails on the lookup (`KeyError`), `"x"` fails in `int()`
> (`ValueError`), and `"80"` converts cleanly, so the third call just returns
> `80`.

## python-intermediate-044
topic: functions
answer: A
run: python

What does this program print?

```python
limit = 10

def check(value, cap=limit):
    return min(value, cap)

limit = 20
print(check(15), check(15, limit))
```

- A: `10 15`
- B: `15 15`
- C: `10 10`
- D: `15 20`

> Default values are evaluated once, when the `def` statement runs, so `cap`
> defaults to `10` forever, whatever `limit` is rebound to later. The second
> call passes the current `limit`, `20`, explicitly, and `min(15, 20)` is 15.

## python-intermediate-045
topic: scope-closures
answer: D
run: python

What does this program print?

```python
x = 1

def f():
    global x
    x = 2
    def g():
        x = 3
        return x
    return g()

print(f(), x)
```

- A: `3 3`
- B: `3 1`
- C: `2 2`
- D: `3 2`

> `global x` applies only to the function that declares it, `f`, so `f` rebinds
> the module's `x` to 2. `g` assigns `x` without any declaration, which makes a
> new local inside `g`, so it returns 3 and leaves the global alone. `print`
> evaluates `f()` before reading `x`.

## python-intermediate-046
topic: oop
answer: B
run: python

What does this program print?

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        self._celsius = max(value, -273)

t = Temperature(-300)
t.celsius += 10
print(t.celsius)
```

- A: `-290`
- B: `-263`
- C: `-273`
- D: It raises an `AttributeError`.

> `self.celsius = ...` in `__init__` goes through the property's setter like any
> other assignment, so the stored value is clamped to -273. `t.celsius += 10`
> reads through the getter (-273), adds 10, and writes -263 back through the
> setter, which leaves it unchanged.

## python-intermediate-047
topic: iterators
answer: C
run: python

What does this program print?

```python
class Box:
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return len(self.items)

class Flag(Box):
    def __bool__(self):
        return True

print(bool(Box([])), bool(Box([0])), bool(Flag([])))
```

- A: `True True True`
- B: `False False True`
- C: `False True True`
- D: `False True False`

> `bool()` calls `__bool__` if the class defines it; otherwise it falls back to
> `__len__` and treats zero length as false. `Box([0])` has length 1, so it is
> true even though its only item is falsy. `Flag` defines `__bool__`, which takes
> precedence over its inherited `__len__`.

## python-intermediate-048
topic: comprehensions
answer: B, C, F

`data` is a list of a million numbers and `f` is a function. Which of these expressions produce their values lazily, computing each one only when it is iterated? Select all that apply.

- A: `[f(x) for x in data]`
- B: `(f(x) for x in data)`
- C: `map(f, data)`
- D: `sorted(data, key=f)`
- E: `{x: f(x) for x in data}`
- F: `filter(f, data)`

> A generator expression, `map` and `filter` all return iterators that call `f`
> one item at a time as they are consumed. List and dict comprehensions build the
> whole collection immediately, and `sorted` has to read and order every item
> before it returns a list.

## python-intermediate-049
topic: stdlib
answer: A
run: python

What does this program print?

```python
people = [("ann", 30), ("bob", 25), ("cid", 30), ("dan", 25)]
by_age = sorted(people, key=lambda p: p[1], reverse=True)
print([name for name, _ in by_age])
```

- A: `['ann', 'cid', 'bob', 'dan']`
- B: `['cid', 'ann', 'dan', 'bob']`
- C: `['bob', 'dan', 'ann', 'cid']`
- D: `['ann', 'bob', 'cid', 'dan']`

> Python's sort is stable, and `reverse=True` keeps that stability: items with
> equal keys stay in their original relative order. It is not the same as sorting
> ascending and reversing the result, which would also flip the ties.

## python-intermediate-050
topic: dicts-sets
answer: D
run: python

What does this program print?

```python
a = frozenset([1, 2, 3])
b = {2, 3, 4}
print(type(a | b).__name__, type(b | a).__name__, sorted(a ^ b))
```

- A: `frozenset frozenset [1, 4]`
- B: `set set [1, 4]`
- C: `frozenset set [2, 3]`
- D: `frozenset set [1, 4]`

> Binary operators that mix `set` and `frozenset` return the type of the left
> operand. `^` is the symmetric difference: the items in exactly one of the two,
> here 1 and 4 (`&` would give 2 and 3).
