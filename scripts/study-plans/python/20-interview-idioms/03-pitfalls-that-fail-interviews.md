---
title: Pitfalls that fail interviews — the twelve Python mistakes interviewers watch for
minutes: 15
---
Interviewers keep a short list of Python mistakes, because the same twelve appear in most rounds and each one says something about how well the candidate knows the language. None is exotic; all are one line. This lesson names them, shows each as it appears in practice, explains the mechanism (which is what the follow-up question will ask), and gives the fix. Read it as a checklist to run over your own code before you say "done": mutable defaults, the shared-row grid, late-binding closures, `is` for values, modifying a list while iterating, `.sort()` returning `None`, integer division and modulo with negatives, float equality, the O(n²) string, the recursion limit, `and`/`or` returning operands, and the broad `except`.

## 1. A mutable default argument

```python
def add_item(item, items=[]):        # the list is created once, at def time
    items.append(item)
    return items
add_item(1); add_item(2)             # [1, 2] — shared between calls
```

Default values are evaluated once when the `def` runs and stored on the function. Fix: `items=None` then `items = [] if items is None else items`. The same applies to `{}` and to any object created in the default.

## 2. The shared-row grid

```python
grid = [[0] * 3] * 2                 # two references to ONE row
grid[0][0] = 1                       # [[1, 0, 0], [1, 0, 0]]
grid = [[0] * 3 for _ in range(2)]   # two rows
```

`*` on a list repeats references, not copies. Fine for immutables (`[0] * 3`), wrong for a list of lists.

## 3. Late-binding closures

```python
fs = [lambda: i for i in range(3)]
[f() for f in fs]                    # [2, 2, 2] — all see the final i
fs = [lambda i=i: i for i in range(3)]      # bind now: [0, 1, 2]
```

A closure captures the variable, not its value at creation. Fix: a default argument, `functools.partial`, or a factory function that takes `i` as a parameter (Module 16).

## 4. `is` for values

```python
if x is 5: ...                       # works by the small-int cache; SyntaxWarning in 3.8+
if s is "done": ...                  # depends on interning
if x is None: ...                    # correct: None is a singleton
```

`is` is identity. Use `==` for values and `is` only for `None`, `True`, `False` and sentinel objects.

## 5. Modifying a list while iterating over it

```python
for x in xs:                         # skips elements after each removal
    if x % 2 == 0: xs.remove(x)
xs = [x for x in xs if x % 2]        # build the new list
for x in xs[:]: ...                  # or iterate a copy
```

Removing shifts the remaining elements under the iterator's index. Dicts raise `RuntimeError: dictionary changed size during iteration` for the same mistake; iterate `list(d)` or build a new dict.

## 6. `.sort()` returns `None`

```python
xs = xs.sort()                       # xs is now None
xs.sort()                            # in place, returns None
ys = sorted(xs)                      # a new list
```

Also `list.append`, `list.reverse`, `dict.update`, `random.shuffle`: in-place methods return `None` by convention.

## 7. Integer division and modulo with negatives

```python
-7 // 2                              # -4: floors towards negative infinity
-7 % 2                               # 1: the result takes the divisor's sign
int(-7 / 2)                          # -3: truncation, when that is what is meant
```

Python floors; C and Java truncate. `divmod(a, b)` returns the consistent pair. For "round half up" use `(a + b // 2) // b` or `decimal`.

## 8. Float equality

```python
0.1 + 0.2 == 0.3                     # False
math.isclose(0.1 + 0.2, 0.3)         # True
round(2.675, 2)                      # 2.67 — the float is slightly below 2.675
```

Compare with a tolerance, format with a fixed precision, or use `fractions.Fraction`/`decimal.Decimal` when exactness is the point (money).

## 9. The O(n²) string

```python
out = ""
for row in rows: out += f"{row}\n"   # may copy the growing string each time
out = "\n".join(f"{row}" for row in rows)
```

CPython optimises some `+=` on strings in place, but not reliably; `join` is always O(n). Same for repeated `list.insert(0, x)` and `pop(0)` (use a deque).

## 10. The recursion limit

```python
def depth(node): return 1 + max(map(depth, node.children), default=0)   # RecursionError at ~1000 deep
sys.setrecursionlimit(1_000_000)     # allows it — and iterative BFS/DFS avoids the question
```

The default limit is 1000 frames; a DFS on a 10⁵-node path exceeds it. Raise the limit, or convert to an explicit stack.

## 11. `and`/`or` return operands, and chained comparisons

```python
name = user_input or "anonymous"     # fine: "" → default
count = n and n * 2                  # returns 0 when n is 0 — and 0 may not be what you meant
0 < x < 10                           # chained: (0 < x) and (x < 10)
x == 1 or 2                          # always truthy: (x == 1) or 2
```

`or` returns the first truthy operand, `and` the first falsy one; `x in (1, 2)` is the fix for the last line.

## 12. The broad `except`

```python
try:
    value = int(text)
except:                              # catches KeyboardInterrupt, SystemExit, typos in the try
    value = 0
except ValueError:                   # the one you mean
    value = 0
```

A bare `except` or `except Exception` around more than one statement hides the bug that would have explained the failure. Catch the specific exception around the specific statement.

## The checklist, before "done"

Defaults immutable? Grid built with a comprehension? Closures bound? `==` for values? Not mutating what I iterate? `sorted` where I need the value? Division floors — intended? Floats compared with tolerance? Strings joined? Recursion depth bounded? `in` instead of `== a or b`? Exceptions specific? Twelve seconds, twelve points.

## Key takeaways

- Defaults and `[[…]] * n` share objects; closures capture variables late; build fresh objects and bind values explicitly.
- `is` is identity — only for `None` and sentinels; `.sort()` and friends return `None`.
- Never mutate the list or dict you are iterating; build a new one.
- `//` and `%` floor; floats need `isclose` or fixed formatting; strings are built with `join`.
- Raise the recursion limit or go iterative; `or` returns operands; catch specific exceptions around specific statements.
