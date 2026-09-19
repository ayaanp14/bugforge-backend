---
title: Names, binding and mutability — there are no boxes
minutes: 14
---
The mental model that carries a Python programmer through every "why did that change too?" moment is this: a variable is a **name bound to an object**, not a box holding a value. Assignment binds; it never copies. Whether a later change through one name is visible through another depends on one question — is the object *mutable*? — and not on how the names were introduced. This lesson builds that model with the objects you already know, adds the assignment forms (multiple, augmented, unpacking, the walrus), and sets up the copying rules that Module 6 needs for lists.

## Assignment binds a name

```python
x = [1, 2, 3]
y = x
```

After these two lines there is *one* list object and two names bound to it. `id(x) == id(y)` and `x is y`. Nothing was copied, because assignment never copies: it evaluates the right side to an object and makes the left name refer to that object. Rebinding one name does not affect the other:

```python
y = [9]        # y now labels a new list; x still labels the first
print(x)       # [1, 2, 3]
```

But *mutating* the shared object through either name is visible through both:

```python
y = x
y.append(4)
print(x)       # [1, 2, 3, 4] — same object
```

The distinction is between **rebinding** (`y = …`, changes which object `y` labels) and **mutation** (`y.append(…)`, `y[0] = …`, changes the object itself). Only mutation is shared.

## Mutable and immutable

| Immutable — cannot be changed in place | Mutable — can be changed in place |
| --- | --- |
| `int`, `float`, `bool`, `complex` | `list`, `dict`, `set` |
| `str`, `bytes`, `tuple`, `frozenset`, `range` | `bytearray`, user-defined class instances (by default) |
| `None` | |

Every operation on an immutable object that looks like a change produces a *new* object: `s = s + "!"`, `s = s.upper()`, `n += 1`. Two names bound to the same string can never observe each other changing, because a string never changes. This is why passing an `int` to a function "by value" and a `list` "by reference" is the wrong description — both are passed the same way (the object is bound to the parameter name); the difference is what the function can *do* to what it received.

```python
def bump(n):
    n += 1            # rebinds the local name to a new int; the caller's object is untouched

def extend(xs):
    xs.append(0)      # mutates the shared list; the caller sees it

def replace(xs):
    xs = [0]          # rebinds the local name; the caller's list is untouched
```

## Augmented assignment

`x += y` calls `x.__iadd__(y)` if the type defines it, and falls back to `x = x + y`. Lists define `__iadd__` to extend in place, so `xs += [4]` mutates the shared list, while `xs = xs + [4]` creates a new one. Integers and strings have no in-place form, so `n += 1` always rebinds. The consequence for a shared list:

```python
a = [1]
b = a
b += [2]           # in place: a is [1, 2]
b = b + [3]        # new list: a is still [1, 2], b is [1, 2, 3]
```

## Multiple names, one line

Python binds several names at once from an iterable on the right — *unpacking*:

```python
a, b = 1, 2                  # a tuple on the right, two targets on the left
a, b = b, a                  # swap: the right side is built before any name is bound
first, *rest = [1, 2, 3, 4]  # first = 1, rest = [2, 3, 4]
x = y = 0                    # both names bound to the same int object
```

The chained form `x = y = []` binds *both* names to the *same* list — the aliasing trap again. `x = y = 0` is fine because ints are immutable.

## The walrus operator

`:=` assigns as an expression (3.8), for the case where a value must be both tested and used:

```python
import re
if (m := re.match(r"(\d+)", line)):
    print(m.group(1))

while (chunk := stream.read(1024)):
    process(chunk)

if (n := len(xs)) > 10:
    print(f"too many: {n}")
```

It binds in the enclosing function scope like ordinary assignment. It is not a general replacement for `=` — the parentheses are needed in most positions, and a reader expects it only where the value is reused immediately.

## Names have no type; objects do

`x = 5` then `x = "five"` is legal. The name `x` has no type; `type(x)` reports the type of the object it currently labels. Type hints (`x: int = 5`) record intent for readers and tools (Module 15) and change nothing at run time. `del x` removes the binding — the object is freed if no other name refers to it — and a later `x` is a `NameError`.

Constants are a convention: `MAX_RETRIES = 3` is an ordinary name that PEP 8 asks you not to rebind. `Final` from `typing` lets a checker enforce it; the interpreter does not.

## Copying, briefly

When you need an independent object, ask for one: `list(xs)`, `xs[:]`, `xs.copy()`, `dict(d)`, `set(s)` make a *shallow* copy — a new container whose elements are the same objects. For nested structures that is not enough (the inner lists are still shared); `copy.deepcopy` copies recursively. Module 6 returns to this with the `[[0] * 3] * 3` trap, which is the same aliasing written as a multiplication.

## Pitfalls

- Expecting `b = a` to copy a list, dict or set.
- `x = y = []` sharing one list between two names.
- A function that mutates its argument when the caller expected a new value, or the reverse.
- `xs += [4]` on a list you meant to leave alone.
- `def f(xs=[])`: the default list is created once and shared by every call (Module 4).
- `is` for value comparison; two equal ints are not guaranteed to be the same object.

## Key takeaways

- A name is a label bound to an object; assignment binds and never copies.
- Rebinding changes the label; mutation changes the object; only mutation is seen through other labels.
- Numbers, strings and tuples are immutable — every "change" is a new object; lists, dicts and sets are mutable.
- `+=` mutates a list in place and rebinds an int or string; `a, b = b, a` swaps; `*rest` gathers.
- `:=` assigns inside an expression; shallow copies share elements, `deepcopy` does not.
