---
title: Closures and late binding — cells, factories and stateful callables
minutes: 13
---
A closure is a function that carries the variables of the scope it was created in, and Module 4 introduced it along with the trap: every closure created in a loop sees the loop variable's *final* value. This lesson goes underneath — what a cell is, how `__closure__` shows it, why late binding is the only consistent rule — and then covers the design patterns that closures make possible: factories that configure behaviour, accumulators with `nonlocal`, callbacks that remember context, and the point at which a closure with state should become a class with `__call__`.

## Cells

```python
def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step

c = make_counter()
c.__closure__                         # (<cell at 0x…: int object at 0x…>,)
c.__closure__[0].cell_contents        # 0
c(); c()
c.__closure__[0].cell_contents        # 2
c.__code__.co_freevars                # ('count',)
```

When the compiler sees that `step` refers to `count` from an enclosing function, it allocates `count` in a *cell* — a small box — instead of an ordinary local slot, and both `make_counter` and `step` read and write the same cell. `step.__closure__` is the tuple of those cells; `co_freevars` names them. The function object keeps the cells alive after `make_counter` returns, which is why the counter works: the frame is gone, the cell is not.

## Late binding, precisely

A closure holds the *cell*, not the value that was in it at creation. Reading the variable happens when the closure runs:

```python
fs = []
for i in range(3):
    fs.append(lambda: i)
[f() for f in fs]                     # [2, 2, 2] — one cell for i, read after the loop ended

def make(i):
    return lambda: i                  # each call creates a NEW cell for its own i
fs = [make(i) for i in range(3)]
[f() for f in fs]                     # [0, 1, 2]
```

The loop version has one `i` variable — one cell — shared by all three lambdas. The factory version calls a function per iteration, and each call has its own local `i`, so each lambda gets its own cell. The default-argument fix (`lambda i=i: i`) works differently: it copies the *value* into the lambda's own parameter at creation time. Both are correct; the factory is the one to prefer when the closure is more than a line, because it names what is being captured.

## Factories

A factory configures a function and returns it — the closure holds the configuration:

```python
def make_validator(lo, hi):
    def valid(x):
        return lo <= x <= hi
    return valid

def make_formatter(prefix, width):
    def fmt(value):
        return f"{prefix}{value:>{width}}"
    return fmt

percent = make_validator(0, 100)
money = make_formatter("$", 8)
```

Compared with a class with `__init__` and one method, the factory is shorter and the result is a plain function usable anywhere a function is expected (`sorted(key=…)`, `map`, callbacks). `functools.partial` (Module 11) is the factory for the case where the configuration is just fixed arguments.

## Accumulators and nonlocal

```python
def make_stats():
    total, count = 0.0, 0
    def add(x):
        nonlocal total, count
        total += x
        count += 1
    def mean():
        return total / count if count else 0.0
    return add, mean

add, mean = make_stats()
```

Two closures over the same cells make a tiny object with two methods and private state. `nonlocal` is needed for the rebinding (`total += x`); reading alone would not need it, and mutating a shared list (`values.append(x)`) would not either, because `append` does not rebind.

## Callbacks that remember

```python
def on_click(label):
    def handler(event):
        print(f"{label} clicked at {event.x},{event.y}")
    return handler

for name in ("ok", "cancel"):
    button(name).bind(on_click(name))     # each handler remembers its own label
```

GUI toolkits, async frameworks and event systems hand you `event` and nothing else; the closure is how the handler knows *which* button, *which* request, *which* row. The loop above is the factory pattern again — `on_click(name)` per iteration — and the late-binding bug would be `bind(lambda e: print(name))`.

## When a closure should be a class

A closure with one piece of state and one behaviour is ideal. When it grows — several pieces of state, several operations, a need to inspect or reset the state, a `__repr__` for debugging — a class with `__call__` keeps the callable interface and gains the rest:

```python
class Counter:
    def __init__(self, start=0):
        self.count = start
    def __call__(self):
        self.count += 1
        return self.count
    def reset(self):
        self.count = 0

c = Counter()
c(); c()                              # callable like the closure
c.count, c.reset()                    # inspectable and resettable, unlike the closure
```

Both are *stateful callables*; the class is the honest form once the state has a name worth reading.

## Pitfalls

- Closures created in a loop capturing the loop variable.
- Forgetting `nonlocal` and getting `UnboundLocalError` on `+=`.
- Closures over a mutable object that another part of the program also changes.
- A closure used as a cheap object that should have been a class.
- Relying on `__closure__` in production code (it is for introspection and debugging).
- Expecting a closure to copy a value; it captures the variable.

## Key takeaways

- Enclosed variables live in cells shared by the outer function and the closure; `__closure__` and `co_freevars` show them.
- A closure reads its cells when called — late binding; a factory call per iteration or a default argument fixes loop capture.
- Factories configure functions; two closures over shared cells make a small object; `nonlocal` is for rebinding.
- Callbacks use closures to remember context the framework does not pass.
- When state and operations multiply, a class with `__call__` replaces the closure.
