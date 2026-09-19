---
title: Lambdas and higher-order functions
minutes: 13
---
A higher-order function takes a function as an argument or returns one, and Python is full of them: `sorted(key=…)`, `max(key=…)`, `map`, `filter`, `functools.reduce`, `functools.partial`, and every callback and decorator you will meet. A `lambda` is the anonymous one-expression function you hand to them when a `def` would be ceremony. This lesson covers the `lambda` syntax and its single limitation, the key-function idiom that sorts and selects by any criterion, `map`/`filter` and when a comprehension beats them, `partial` for fixing arguments, `reduce` for folds, and the `operator` module that names every operator as a function.

## lambda

```python
square = lambda x: x * x          # equivalent to def square(x): return x * x
print(square(4))                  # 16
```

`lambda params: expression` builds a function object whose body is a single *expression* — no statements, no `return` (the expression's value is returned), no assignment, no loops, no `if` statement (the conditional *expression* is fine). It can take defaults, `*args` and `**kwargs` like any function. Its `__name__` is `'<lambda>'`, which is the reason not to assign one to a name as above: `def` gives the function a real name for tracebacks and `help`, at the cost of one more line. A lambda belongs *inline*, as an argument, where the reader sees it and its use together.

## Key functions

Every ordering built-in takes `key=`, a one-argument function applied to each element to produce the value that is actually compared:

```python
words = ["banana", "Apple", "cherry"]
sorted(words)                         # ['Apple', 'banana', 'cherry'] — uppercase sorts first
sorted(words, key=str.lower)          # ['Apple', 'banana', 'cherry'] — case-insensitive
sorted(words, key=len)                # ['Apple', 'banana', 'cherry'] — by length (stable on ties)
max(words, key=len)                   # 'banana'
sorted(pairs, key=lambda p: (-p[1], p[0]))    # by second value descending, then first ascending
```

The key is computed once per element (not on every comparison), so an expensive key is fine. Returning a tuple sorts by several criteria in order; negating a numeric component reverses just that criterion; `reverse=True` reverses the whole order. Any callable works as a key — a built-in (`len`, `str.lower`, `abs`), a lambda, a `def`, or the `operator` helpers below.

## map and filter

`map(f, iterable)` applies `f` to each element lazily; `filter(pred, iterable)` keeps the elements for which `pred` is true. Both return iterators, so wrap in `list()` to see them:

```python
list(map(int, ["1", "2", "3"]))                  # [1, 2, 3]
list(filter(str.isdigit, ["1", "a", "22"]))      # ['1', '22']
list(map(lambda x, y: x + y, [1, 2], [10, 20]))  # [11, 22] — map takes several iterables
```

`map(int, tokens)` and `filter(None, xs)` (drops falsy values) are the idiomatic uses: an existing function applied to everything. The moment you write `map(lambda x: …)` or `filter(lambda x: …)`, a comprehension says the same thing more readably — `[x * 2 for x in xs]`, `[x for x in xs if x > 0]` — and can combine both (Module 6). Choose `map` when the function already exists; choose the comprehension when you would have to write a lambda.

## functools.partial

`partial(f, *args, **kwargs)` returns a new function with some of `f`'s arguments fixed:

```python
from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)
print(square(5), cube(2))          # 25 8

int_from_binary = partial(int, base=2)
list(map(int_from_binary, ["101", "11"]))   # [5, 3]
```

It replaces `lambda x: power(x, 2)`, and unlike the lambda it carries its function and fixed arguments as inspectable attributes (`square.func`, `square.keywords`). It is also the cleanest fix for late binding in loops (Module 4 lesson 3), because the argument is bound at the moment `partial` is called.

## functools.reduce

`reduce(f, iterable, initial)` folds a sequence to one value by applying `f(accumulator, element)` left to right:

```python
from functools import reduce
import operator

reduce(operator.mul, [1, 2, 3, 4], 1)       # 24 — the product
reduce(lambda a, b: a if len(a) >= len(b) else b, words)   # the longest word (first on ties)
```

Python deliberately left `reduce` out of the built-ins: `sum`, `min`, `max`, `any`, `all`, `math.prod` and `"".join` cover the common folds by name, and a `for` loop with an accumulator is clearer than a `reduce` with a lambda. Reach for it when the combining function *is* a named function and the fold has no built-in.

## The operator module

`operator.add`, `mul`, `neg`, `lt`, `eq`, `contains`, `getitem` and the rest are the operators as functions — the arguments `reduce`, `map` and `sorted` want when a lambda would only wrap an operator. Three factories are used constantly with `key=`:

```python
from operator import itemgetter, attrgetter, methodcaller

sorted(rows, key=itemgetter(2))          # by column 2
sorted(rows, key=itemgetter(1, 0))       # by column 1, then 0 — returns a tuple
sorted(people, key=attrgetter("age"))    # by an attribute
sorted(words, key=methodcaller("lower")) # by calling a method
```

`itemgetter(1)` is `lambda x: x[1]` with a name and a small speed advantage.

## Functions returning functions

The factory pattern — a function that builds and returns a specialised function — is the closure of the previous lesson put to work:

```python
def make_validator(lo, hi):
    def valid(x):
        return lo <= x <= hi
    return valid

in_percent = make_validator(0, 100)
print(in_percent(50), in_percent(150))    # True False
```

Decorators (Module 16) are exactly this with the function itself as the input.

## Pitfalls

- A lambda that needs a statement — it cannot; write a `def`.
- Assigning a lambda to a name instead of using `def`.
- Forgetting `list()` around `map`/`filter` and printing `<map object at …>`; or iterating one twice (it is exhausted after the first pass).
- `key=len()` — calling instead of passing; `key=len`.
- `reduce` with a lambda where `sum` or a loop is clearer.
- `sorted(xs, key=lambda x: -x)` on strings — negation needs numbers; use `reverse=True`.

## Key takeaways

- `lambda params: expression` is an inline single-expression function; use `def` for anything named or multi-line.
- `key=` on `sorted`/`min`/`max` selects the comparison value; tuples sort by several criteria, negation reverses one.
- `map`/`filter` apply existing functions lazily; prefer a comprehension when you would write a lambda.
- `partial` fixes arguments; `reduce` folds with a named function; `operator` names the operators and `itemgetter`/`attrgetter` make keys.
- A function returning a function is a closure factory — the shape decorators build on.
