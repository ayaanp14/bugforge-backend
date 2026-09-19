---
title: functools and operator — the function toolkit
minutes: 13
---
`functools` collects the tools for working *with* functions: caching results, fixing arguments, folding sequences, preserving metadata through wrappers, dispatching on a type, and deriving comparison methods. `operator` supplies every operator as a named function so that `map`, `sorted`, `reduce` and the itertools can be handed `add` or `itemgetter(1)` instead of a lambda. This lesson covers `cache` and `lru_cache`, `partial` and `partialmethod`, `reduce`, `wraps`, `cached_property`, `singledispatch`, `total_ordering`, and the `operator` functions and factories, with the rules for when each beats the plain alternative.

## Caching

```python
from functools import cache, lru_cache

@cache                              # unbounded; arguments must be hashable
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

@lru_cache(maxsize=256)             # bounded: evicts least-recently-used entries
def lookup(key):
    return expensive(key)

fib.cache_info()                    # CacheInfo(hits=…, misses=…, maxsize=None, currsize=…)
fib.cache_clear()
```

The function must be *pure* (same arguments, same result, no effects that matter) and the arguments hashable — a list argument raises `TypeError`; pass a tuple. `cache` is right for recursion and for a fixed set of inputs; `lru_cache(maxsize)` for an open-ended set where memory must be bounded. A method decorated with `cache` keys on `self` too, and keeps every instance alive in the cache — for per-instance memoisation, `cached_property` (below) or an explicit dict on the instance is cleaner.

## partial

```python
from functools import partial

power = lambda base, exp: base ** exp
square = partial(power, exp=2)
int_from_hex = partial(int, base=16)
list(map(int_from_hex, ["ff", "10"]))     # [255, 16]

square.func, square.keywords             # the original and the fixed arguments
```

`partial(f, *args, **kwargs)` fixes arguments *from the left* (positionally) or by name. Compared with `lambda x: power(x, 2)`: it is introspectable, picklable, slightly faster, and binds its arguments at creation — the fix for late binding in loops (Module 4). `partialmethod` is the same for methods defined in a class body.

## reduce

```python
from functools import reduce
import operator

reduce(operator.mul, [1, 2, 3, 4], 1)        # 24
reduce(lambda acc, x: acc * 10 + x, [1, 2, 3], 0)   # 123 — digits to a number
reduce(operator.or_, sets, set())            # union of many sets
reduce(dict.__or__, dicts, {})               # merge many dicts, later winning
```

`reduce(f, iterable, initial)` folds left: `f(f(f(initial, x0), x1), x2)`. Always pass `initial` — without it an empty iterable raises `TypeError` and the first element is used as the seed. Use it when the combining function has a name (`operator.mul`, `set.union`) and no built-in fold exists; `sum`, `min`, `max`, `any`, `all`, `math.prod`, `"".join` and `itertools.accumulate` cover the rest more readably.

## wraps

```python
from functools import wraps

def logged(fn):
    @wraps(fn)                       # copies __name__, __doc__, __module__, __qualname__, __wrapped__
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper
```

Without `@wraps`, every decorated function reports its name as `wrapper` in tracebacks, `help()` and test output. Module 16 covers decorators in full; the rule here is simply that a wrapper function always carries `@wraps(fn)`.

## cached_property and total_ordering

```python
from functools import cached_property, total_ordering

class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property                 # computed once per instance, stored in __dict__
    def total(self):
        return sum(r.amount for r in self.rows)

@total_ordering                      # __lt__ + __eq__ → all six comparisons
class Version:
    ...
```

Both appeared in Module 8; they live in `functools`.

## singledispatch

```python
from functools import singledispatch

@singledispatch
def describe(value):                 # the default
    return f"object {value!r}"

@describe.register
def _(value: int):
    return f"int {value}"

@describe.register(list)
def _(value):
    return f"list of {len(value)}"

describe(3), describe([1, 2]), describe("s")    # 'int 3', 'list of 2', "object 's'"
```

`singledispatch` picks an implementation by the *type of the first argument*, with subclasses matching their nearest registered base (and ABCs honoured), so `describe(True)` uses the `int` version. It is the honest form of the `isinstance` chain from Module 9 for operations that do not belong on the types themselves — formatting, serialising, converting external data — and it is extensible from outside: another module can register a new type without touching the original function. `singledispatchmethod` does the same for methods.

## The operator module

```python
import operator
from operator import itemgetter, attrgetter, methodcaller

operator.add(2, 3)                         # 5;  also sub, mul, truediv, floordiv, mod, pow, neg
operator.lt(1, 2), operator.eq(a, b)       # comparisons
operator.and_, operator.or_, operator.xor  # bitwise / set operations (trailing underscore: keywords)
operator.contains(xs, 3), operator.getitem(d, "k")

sorted(rows, key=itemgetter(2))            # by column 2
sorted(rows, key=itemgetter(1, 0))         # by columns 1 then 0 — the key returns a tuple
sorted(people, key=attrgetter("age", "name"))
sorted(words, key=methodcaller("lower"))
list(map(methodcaller("strip", "-"), lines))
```

`itemgetter`/`attrgetter`/`methodcaller` build key and mapping functions without lambdas, and `itemgetter(1)` is measurably faster than `lambda r: r[1]`. `operator.index`, `operator.length_hint` and the in-place variants (`iadd`, …) round out the set.

## Pitfalls

- `@cache` on a function with side effects or unhashable arguments.
- `@cache` on a method, keeping every instance alive.
- `reduce` without `initial` on a possibly-empty input.
- A decorator without `@wraps`.
- `singledispatch` with the type in the wrong place (it dispatches on the *first* argument only).
- `operator.and`/`or` — the names have a trailing underscore.

## Key takeaways

- `@cache`/`@lru_cache(maxsize)` memoise pure functions with hashable arguments; `cache_info`/`cache_clear` inspect and reset.
- `partial` fixes arguments at creation and is introspectable; prefer it to a lambda that only fixes arguments.
- `reduce(f, it, initial)` folds left with a named function; use the built-in folds when they exist.
- `@wraps` on every wrapper; `cached_property` and `total_ordering` for classes; `singledispatch` for type-based dispatch that lives outside the types.
- `operator` names every operator; `itemgetter`, `attrgetter`, `methodcaller` build key functions.
