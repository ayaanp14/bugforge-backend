---
skill: python
level: intermediate
---

## python-intermediate-001
topic: functions
answer: B
run: python

What does this program print?

```python
def add(item, bucket=[]):
    bucket.append(item)
    return bucket

a = add(1)
b = add(2, [])
c = add(3)
print(a, b, c)
```

- A: `[1] [2] [3]`
- B: `[1, 3] [2] [1, 3]`
- C: `[1] [2] [1, 3]`
- D: `[1, 2, 3] [1, 2] [1, 2, 3]`

> The default list is created once, when `def` runs, and stored on the function.
> The first and third calls both append to that one list, so `a` and `c` are the
> same object and both show `[1, 3]`. The second call passed its own list, so it
> never touched the default. The usual fix is `bucket=None` and a new list inside.

## python-intermediate-002
topic: scope-closures
answer: C
run: python

What does this program print?

```python
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])
```

- A: `[0, 1, 2]`
- B: `[3, 3, 3]`
- C: `[2, 2, 2]`
- D: It raises a `NameError` because `i` no longer exists.

> Each lambda closes over the variable `i`, not its value at creation time. The
> lambdas are only called after the comprehension has finished, when `i` holds its
> last value, `2`. The closure keeps the variable alive, so there is no
> `NameError`. Binding the value with a default (`lambda i=i: i`) gives `[0, 1, 2]`.

## python-intermediate-003
topic: oop
answer: A
run: python

What does this program print?

```python
class Team:
    members = []

    def __init__(self, name):
        self.name = name

    def join(self, person):
        self.members.append(person)

a = Team("red")
b = Team("blue")
a.join("x")
b.join("y")
print(len(a.members), len(Team.members))
```

- A: `2 2`
- B: `1 0`
- C: `1 2`
- D: `2 0`

> `members` is a class attribute: one list shared by the class and every instance.
> `self.members.append(...)` looks the name up, finds the class's list and mutates
> it in place, without creating an instance attribute. Both appends land in the
> same list, so every view of it has length 2. Per-instance lists belong in
> `__init__` (`self.members = []`).

## python-intermediate-004
topic: iterators
answer: D
run: python

What does this program print?

```python
data = [3, 1, 4, 1, 5]
it = iter(data)
print(max(it), sum(it), sum(data))
```

- A: `5 14 14`
- B: `5 0 0`
- C: It raises a `ValueError`.
- D: `5 0 14`

> `max(it)` has to read every item to find the largest, which exhausts the
> iterator. `sum(it)` then sees an empty stream and returns its start value, `0`
> (no error: only `max` of an empty iterable raises). The list itself is not
> consumed, so `sum(data)` still sees all five numbers: 14.

## python-intermediate-005
topic: comprehensions
answer: B
run: python

What does this program print?

```python
def numbers():
    for n in range(3):
        print("yield", n, end=" ")
        yield n

gen = numbers()
print("created", end=" ")
first = next(gen)
print("got", first)
```

- A: `yield 0 yield 1 yield 2 created got 0`
- B: `created yield 0 got 0`
- C: `yield 0 created got 0`
- D: `created yield 0 yield 1 yield 2 got 0`

> Calling a generator function runs none of its body; it only builds the
> generator object, so `created` prints first. `next(gen)` runs the body up to
> the first `yield`, printing `yield 0` and handing back `0`, then pauses there.
> The rest of the loop never runs because nothing asks for another value.

## python-intermediate-006
topic: decorators
answer: A
run: python

What does this program print?

```python
def bold(func):
    def wrapper():
        return "<b>" + func() + "</b>"
    return wrapper

def italic(func):
    def wrapper():
        return "<i>" + func() + "</i>"
    return wrapper

@bold
@italic
def hello():
    return "hi"

print(hello())
```

- A: `<b><i>hi</i></b>`
- B: `<i><b>hi</b></i>`
- C: `<b>hi</b>`
- D: `<i>hi</i>`

> Stacked decorators apply bottom-up: `hello = bold(italic(hello))`. The
> decorator nearest the function wraps it first, so `italic`'s tags sit closest to
> the text and `bold`'s wrapper, the outermost, adds its tags last, around
> everything.

## python-intermediate-007
topic: stdlib
answer: C
run: python

What does this program print?

```python
from collections import Counter

c = Counter("mississippi")
print(c.most_common(2))
```

- A: `[('s', 4), ('i', 4)]`
- B: `['i', 's']`
- C: `[('i', 4), ('s', 4)]`
- D: `{'i': 4, 's': 4}`

> `most_common(n)` returns a list of `(element, count)` pairs, highest count
> first. `i` and `s` both occur four times; elements with equal counts keep the
> order in which they were first encountered, and `i` (index 1) appears before
> `s` (index 2).

## python-intermediate-008
topic: exceptions
answer: D
run: python

What does this program print?

```python
def work():
    try:
        print("try", end=" ")
    except ValueError:
        print("except", end=" ")
    else:
        print("else", end=" ")
        raise ValueError("from else")
    finally:
        print("finally", end=" ")

try:
    work()
except ValueError:
    print("outer")
```

- A: `try else except finally`
- B: `try else finally`
- C: `try else except finally outer`
- D: `try else finally outer`

> The `try` body raises nothing, so `else` runs. An exception raised in the
> `else` block is not handled by the `except` clauses of the same statement; they
> only cover the `try` body. `finally` still runs on the way out, then the
> `ValueError` propagates to the caller, whose handler prints `outer`.

## python-intermediate-009
topic: dicts-sets
answer: B
run: python

What does this program print?

```python
d = {1: "int", True: "bool", 1.0: "float"}
print(d)
```

- A: `{1: 'int', True: 'bool', 1.0: 'float'}`
- B: `{1: 'float'}`
- C: `{1.0: 'float'}`
- D: `{1: 'int'}`

> `1`, `True` and `1.0` compare equal and have the same hash, so they are the same
> dict key. Each later entry overwrites the value, but the key object stored is
> the one inserted first, `1`. The result is one entry: the first key with the
> last value.

## python-intermediate-010
topic: lists-tuples
answer: C
run: python

What does this program print?

```python
grid = [[0] * 3] * 3
grid[0][1] = 5
grid[1] = [7, 7, 7]
print(grid)
```

- A: `[[0, 5, 0], [7, 7, 7], [0, 0, 0]]`
- B: `[[7, 7, 7], [7, 7, 7], [7, 7, 7]]`
- C: `[[0, 5, 0], [7, 7, 7], [0, 5, 0]]`
- D: `[[5, 5, 5], [7, 7, 7], [5, 5, 5]]`

> `[row] * 3` repeats a reference: all three slots hold the same inner list, so
> writing `grid[0][1]` shows in every row. `grid[1] = [...]` rebinds one slot of
> the outer list to a new list and leaves the other two still sharing the
> original. The integers inside `[0] * 3` are separate cells, so only index 1
> changed.

## python-intermediate-011
topic: functions
answer: D

```python
def connect(host, port=80, *, timeout, retries=3):
    ...
```

Which of these calls raises a `TypeError`?

- A: `connect("db", timeout=5)`
- B: `connect("db", 5432, timeout=5)`
- C: `connect(host="db", retries=0, timeout=5)`
- D: `connect("db", 5432, 5)`

> Parameters after a bare `*` are keyword-only. `connect("db", 5432, 5)` passes
> three positional arguments to a function that accepts at most two, and it never
> supplies the required `timeout`, so it raises `TypeError`. The other calls give
> `timeout` by keyword and pass `host` and `port` legally.

## python-intermediate-012
topic: scope-closures
answer: A

```python
count = 0

def increment():
    count += 1
    return count

increment()
```

What happens when the last line runs?

- A: It raises `UnboundLocalError` when the function is called.
- B: It returns `1`, and the global `count` becomes `1`.
- C: It returns `1`, and the global `count` stays `0`.
- D: It fails with `SyntaxError` before anything runs.

> Any assignment to a name inside a function (including `+=`) makes that name
> local to the whole function, decided at compile time. `count += 1` therefore
> reads a local `count` that has no value yet, which raises `UnboundLocalError`
> (a subclass of `NameError`) at call time. `global count` would fix it.

## python-intermediate-013
topic: oop
answer: B
run: python

What does this program print?

```python
class A:
    def hi(self):
        return "A"

class B(A):
    def hi(self):
        return "B" + super().hi()

class C(A):
    def hi(self):
        return "C" + super().hi()

class D(B, C):
    def hi(self):
        return "D" + super().hi()

print(D().hi())
```

- A: `DBA`
- B: `DBCA`
- C: `DCBA`
- D: `DBACA`

> `D`'s method resolution order is `D, B, C, A, object`. `super()` means "the next
> class in the MRO of the instance", not "my parent", so `super()` inside `B`
> reaches `C` when the object is a `D`. Each class runs once: D, B, C, then A.

## python-intermediate-014
topic: iterators
answer: C

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)

points = {Point(1, 2), Point(1, 2)}
```

What happens on the last line?

- A: `points` holds one `Point`, because the two are equal.
- B: `points` holds two `Point`s, because each hashes by identity.
- C: It raises `TypeError`, because `Point` instances are unhashable.
- D: It raises `AttributeError`, because `Point` has no `__hash__`.

> A class that defines `__eq__` without `__hash__` gets `__hash__ = None`, since
> the inherited identity hash would break the rule that equal objects hash
> equally. Putting an instance in a set then raises `TypeError: unhashable type:
> 'Point'`. Defining `__hash__` (e.g. `hash((self.x, self.y))`) makes it work.

## python-intermediate-015
topic: comprehensions
answer: D
run: python

What does this program print?

```python
data = [1, 2, 3]
gen = (x * 2 for x in data)
data.append(4)
data = [10, 20]
print(list(gen))
```

- A: `[20, 40]`
- B: `[2, 4, 6]`
- C: `[]`
- D: `[2, 4, 6, 8]`

> A generator expression evaluates its outermost iterable immediately, when it is
> created, so `gen` holds an iterator over the original list object. Appending
> `4` mutates that same object before iteration starts, so it is seen; rebinding
> the name `data` afterwards does not affect the generator at all.

## python-intermediate-016
topic: decorators
answer: A
run: python

What does this program print?

```python
import functools

def plain(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def careful(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@plain
def load():
    return "data"

@careful
def save():
    return "ok"

print(load.__name__, save.__name__)
```

- A: `wrapper save`
- B: `load save`
- C: `wrapper wrapper`
- D: `load wrapper`

> A decorator replaces the function with whatever it returns, so `load` now names
> the inner `wrapper` function and reports that name. `functools.wraps` copies the
> wrapped function's `__name__`, `__doc__`, `__qualname__` and more onto the
> wrapper, so `save` keeps its own name.

## python-intermediate-017
topic: stdlib
answer: C
run: python

What does this program print?

```python
from collections import defaultdict

d = defaultdict(int)
d["a"] += 1
if d["b"]:
    print("unreachable")
print("c" in d, d.get("e"), len(d))
```

- A: `False 0 3`
- B: `False None 1`
- C: `False None 2`
- D: `False 0 2`

> Reading a missing key with `d[key]` calls the factory and inserts the result,
> so `d["b"]` adds `"b": 0` even though it is only tested. Membership tests and
> `.get()` do not go through the factory: `in` is `False`, `.get("e")` returns
> `None` and inserts nothing. The dict holds `a` and `b`.

## python-intermediate-018
topic: exceptions
answer: B

```python
try:
    1 / 0
except ZeroDivisionError as e:
    pass

print(e)
```

What happens on the last line?

- A: It prints `division by zero`.
- B: It raises `NameError`.
- C: It prints `None`.
- D: It prints `ZeroDivisionError('division by zero')`.

> The name bound by `except ... as e` is deleted when the `except` block ends
> (Python 3 does this to break the reference cycle through the traceback). After
> the block, `e` does not exist, so `print(e)` raises `NameError`. Assign it to
> another name inside the block if you need it later.

## python-intermediate-019
topic: dicts-sets
answer: A, C

Which of these values can be used as a dictionary key? Select all that apply.

- A: `(1, 2)`
- B: `[1, 2]`
- C: `frozenset({1, 2})`
- D: `(1, [2])`
- E: `{"a": 1}`

> A key must be hashable. Tuples are hashable only if every element is, so
> `(1, 2)` works and `(1, [2])` raises `TypeError` when hashed because it holds a
> list. `frozenset` is the immutable, hashable set. Lists and dicts are mutable
> and unhashable.

## python-intermediate-020
topic: functions
answer: D
run: python

What does this program print?

```python
def f(a, b=2, *args, c=3, **kwargs):
    print(a, b, args, c, kwargs)

f(1, 4, 5, 6, d=7)
```

- A: `1 2 (4, 5, 6) 3 {'d': 7}`
- B: `1 4 (5, 6) 7 {}`
- C: `1 4 [5, 6] 3 {'d': 7}`
- D: `1 4 (5, 6) 3 {'d': 7}`

> Positional arguments fill `a` and `b` first (a default does not reserve a
> slot), and the rest go to `*args` as a tuple. `c` comes after `*args`, so it is
> keyword-only and keeps its default. The unmatched keyword `d` lands in
> `**kwargs`.

## python-intermediate-021
topic: scope-closures
answer: A
run: python

What does this program print?

```python
def make_counter():
    n = 0
    def inc():
        nonlocal n
        n += 1
        return n
    return inc

a = make_counter()
b = make_counter()
a()
a()
print(a(), b())
```

- A: `3 1`
- B: `3 4`
- C: `1 1`
- D: `2 1`

> Each call to `make_counter` creates a new `n` and a new closure over it.
> `nonlocal` lets `inc` rebind that enclosing `n`, so the state persists between
> calls of the same counter: `a` reaches 3 on its third call. `b` has its own
> `n` and starts from 0.

## python-intermediate-022
topic: oop
answer: C

```python
class Account:
    def __init__(self):
        self.__balance = 100

acct = Account()
```

Which expression evaluates to `100`?

- A: `acct.__balance`
- B: `acct._balance`
- C: `acct._Account__balance`
- D: `Account.__balance`

> A name with two leading underscores (and no two trailing) inside a class body is
> mangled to `_ClassName__name`, so the attribute is stored as
> `_Account__balance`. `acct.__balance` outside the class raises
> `AttributeError`, and the attribute is on the instance, not the class.

## python-intermediate-023
topic: stdlib
answer: B
run: python

What does this program print?

```python
from collections import deque

q = deque(maxlen=3)
for n in range(5):
    q.append(n)
q.appendleft(9)
print(list(q))
```

- A: `[9, 3, 4]`
- B: `[9, 2, 3]`
- C: `[9, 2, 3, 4]`
- D: `[2, 3, 4]`

> A bounded deque never grows past `maxlen`: when it is full, adding to one end
> discards from the opposite end. The appends leave `[2, 3, 4]`; `appendleft(9)`
> then drops the rightmost item, `4`.

## python-intermediate-024
topic: decorators
answer: D
run: python

What does this program print?

```python
class Quiet:
    def __enter__(self):
        print("in", end=" ")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("out", end=" ")
        return True

with Quiet():
    print("body", end=" ")
    raise ValueError("boom")
    print("after", end=" ")
print("done")
```

- A: `in body after out done`
- B: `in body done out`
- C: It prints `in body out`, then the `ValueError` propagates.
- D: `in body out done`

> The exception stops the `with` body, so `after` never prints. `__exit__` runs
> with the exception's details, and because it returns a truthy value the
> exception is suppressed. Execution continues after the `with` statement and
> prints `done`.

## python-intermediate-025
topic: lists-tuples
answer: A
run: python

What does this program print?

```python
import copy

a = [[1, 2], [3]]
b = a.copy()
c = copy.deepcopy(a)
a[0].append(9)
a.append([4])
print(len(b), b[0], c[0])
```

- A: `2 [1, 2, 9] [1, 2]`
- B: `3 [1, 2, 9] [1, 2]`
- C: `2 [1, 2] [1, 2]`
- D: `2 [1, 2, 9] [1, 2, 9]`

> `a.copy()` is shallow: `b` is a new outer list holding the same inner lists.
> Appending to `a` itself does not change `b`'s length, but mutating `a[0]` is
> visible through `b[0]`. `deepcopy` copied the inner lists too, so `c[0]` is
> unaffected.
