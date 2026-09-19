---
title: Generators — functions that yield
minutes: 14
---
A generator is an iterator written as a function: instead of a class with state in attributes and a `__next__` that reads it, you write a function with `yield`, and Python keeps the state — every local variable and the position in the code — between calls. The previous lesson's `Countdown` becomes three lines. Generators are how most iterators in Python are written, how large or infinite sequences are produced without memory, and how pipelines of transformations are composed. This lesson covers the mechanics of `yield`, laziness and suspension, infinite generators with `islice`, `yield from`, `return` in a generator, and the `send`/`close` protocol in outline.

## yield

```python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

list(countdown(3))         # [3, 2, 1]
g = countdown(2)
type(g)                    # <class 'generator'>
next(g), next(g)           # 2, 1
next(g)                    # StopIteration
```

A function containing `yield` does not run when called: it returns a *generator object*. Each `next()` runs the body until the next `yield`, hands out the yielded value, and **suspends** — locals intact, position remembered. The next `next()` resumes right after the `yield`. When the function returns (falls off the end or hits `return`), the generator raises `StopIteration`. The generator object is an iterator: `for` works, `list()` works, it is one-shot.

## Laziness

```python
def squares(n):
    for i in range(n):
        print(f"computing {i}")
        yield i * i

g = squares(3)             # nothing printed yet
next(g)                    # computing 0 → 0
for v in g:                # computing 1, computing 2
    pass
```

Work happens only when a value is asked for. Three consequences: a generator over a million items uses the memory of one item; a consumer that stops early (`next`, `any`, `break`) never triggers the rest; and an exception inside a generator surfaces at the `next()` that runs the failing code, not at the call that created the generator.

## Infinite generators

Because values are produced on demand, a generator may never end, and a consumer takes what it needs:

```python
import itertools

def naturals():
    n = 0
    while True:
        yield n
        n += 1

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

list(itertools.islice(fibonacci(), 10))        # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
next(x for x in naturals() if x * x > 500)     # 23
list(itertools.takewhile(lambda x: x < 100, fibonacci()))
```

`islice(g, n)` takes the first `n`; `takewhile` takes while a condition holds; `next(...)` takes the first matching. Never call `list()`, `sum()` or `sorted()` on an infinite generator without a bound.

## Generators as __iter__

```python
class Tree:
    def __init__(self, value, children=()):
        self.value, self.children = value, list(children)

    def __iter__(self):                         # depth-first, pre-order
        yield self.value
        for child in self.children:
            yield from child                    # delegate to the child's iterator
```

Writing `__iter__` as a generator is the idiomatic way to make a class iterable — and, because each call creates a fresh generator, the object is re-iterable. `yield from iterable` yields every value of a sub-iterable, which is what makes recursive traversals a few lines: flattening nested lists, walking a tree, walking a JSON document (Module 7).

## return and StopIteration

A `return value` inside a generator ends it; the value is attached to the `StopIteration` (`e.value`) and is what `yield from` evaluates to. Raising `StopIteration` *manually* inside a generator is an error since 3.7 (it becomes `RuntimeError`) — use `return`. `next(g, default)` handles exhaustion without a `try`.

## Generators are one-shot

```python
g = countdown(3)
sum(g)          # 6
sum(g)          # 0 — exhausted
```

A generator *object* cannot be rewound. To iterate again, call the generator *function* again. Store the function call in a helper (`def data(): return countdown(3)`) or materialise (`list(...)`) when two passes are needed.

## Pipelines

Generators compose: each stage consumes the previous one lazily, and only the final consumer pulls values through the chain:

```python
def read_lines(text):
    for line in text.splitlines():
        yield line.strip()

def non_empty(lines):
    for line in lines:
        if line:
            yield line

def parse(lines):
    for line in lines:
        key, _, value = line.partition("=")
        yield key, int(value)

total = sum(v for _, v in parse(non_empty(read_lines(text))))
```

No intermediate lists; each line flows through all stages before the next line is read. Module 11 lesson 6 builds a full pipeline; the shape is stage functions that take an iterable and `yield`.

## send, throw and close

A generator is also a *coroutine* in the original sense: `g.send(value)` resumes it with `value` as the result of the `yield` expression (`received = yield`), `g.throw(exc)` raises inside it at the `yield`, and `g.close()` raises `GeneratorExit` there so `finally` blocks run. These are the mechanism `@contextmanager` uses (Module 10) and the ancestor of `async`/`await` (Module 17); ordinary iteration code never needs them, and a generator with `finally` should be closed (or fully consumed) so its cleanup runs.

## Pitfalls

- Calling a generator function and expecting the body to run — it runs on `next`.
- `list()` or `sum()` on an infinite generator.
- Iterating a generator object twice.
- `raise StopIteration` inside a generator (use `return`).
- A generator that mutates shared state as a side effect of being consumed — surprising when the consumer is lazy.
- Forgetting `yield from` and writing `for x in sub: yield x` (fine, but `yield from` also forwards `send`/`throw`).

## Key takeaways

- A function with `yield` returns a generator: an iterator whose state is its locals; `next` runs to the next `yield` and suspends.
- Values are produced lazily and never stored; infinite generators are bounded by `islice`, `takewhile` or `next`.
- Write `__iter__` as a generator; `yield from` delegates and makes recursive traversals short.
- `return` ends a generator (its value rides on `StopIteration`); generator objects are one-shot — call the function again.
- Stages that take an iterable and `yield` compose into pipelines with no intermediate lists.
