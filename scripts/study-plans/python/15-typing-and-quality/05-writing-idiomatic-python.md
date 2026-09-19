---
title: Writing idiomatic Python — the idioms, the anti-patterns and a refactoring
minutes: 14
---
"Pythonic" is not a vague compliment; it names a specific set of idioms that the language's design makes shorter, clearer and often faster than their alternatives, and a matching set of anti-patterns that read as a translation from another language. This lesson lists both sides — most have appeared earlier in the track, and this is where they are gathered — and then works through one refactoring from a literal translation of Java-style code to the Python it should have been, so that the idioms are seen doing their job together.

## The idioms

| Instead of | Write |
| --- | --- |
| `for i in range(len(xs)): x = xs[i]` | `for x in xs:` / `for i, x in enumerate(xs):` |
| `i = 0; while i < n: …; i += 1` | `for i in range(n):` |
| `for i in range(len(a)): a[i], b[i]` | `for x, y in zip(a, b):` |
| `if len(xs) == 0:` / `if xs == []:` | `if not xs:` |
| `if x == None:` | `if x is None:` |
| `if flag == True:` | `if flag:` |
| `if type(x) == int:` | `if isinstance(x, int):` |
| `tmp = a; a = b; b = tmp` | `a, b = b, a` |
| `result = []; for x in xs: result.append(f(x))` | `result = [f(x) for x in xs]` |
| `if k in d: v = d[k] else: v = default` | `v = d.get(k, default)` |
| `if k not in d: d[k] = []; d[k].append(x)` | `d.setdefault(k, []).append(x)` or `defaultdict(list)` |
| `s = ""; for p in parts: s += p` | `s = "".join(parts)` |
| `"%s is %d" % (a, b)` / `a + " is " + str(b)` | `f"{a} is {b}"` |
| `f = open(p); …; f.close()` | `with open(p, encoding="utf-8") as f:` |
| `try: … except: pass` | `except SpecificError:` or `contextlib.suppress` |
| `def f(xs=[]):` | `def f(xs=None): xs = [] if xs is None else xs` |
| a class with only `__init__` and getters | a `@dataclass` (or a `NamedTuple`) |
| `class Stack(list)` | composition: a class holding a list |
| `lambda x: x[1]` as a key | `operator.itemgetter(1)` |
| a flag variable to signal "found" | `return` from the loop, or `for … else` |
| `os.path.join(a, b)` string juggling | `Path(a) / b` |
| checking then acting (`if os.path.exists(p): open(p)`) | `try: open(p) except FileNotFoundError:` (EAFP) |
| global mutable state | pass values in, return values out; a class if state must persist |

Each right-hand side is shorter *and* expresses the intent — "for each element", "if empty", "the value or a default" — where the left-hand side expresses the mechanism.

## The anti-patterns that hide bugs

- **Mutable default arguments** (Module 4): shared across calls.
- **Modifying a list while iterating it** (Module 3): skipped elements.
- **`==` on floats** (Module 2): use `math.isclose` or integer arithmetic.
- **Bare `except:`** (Module 10): swallows `KeyboardInterrupt` and every bug.
- **`is` on values** (`x is 5`): identity is not equality.
- **`import *`**: names of unknown origin, silent shadowing.
- **String-built SQL or shell commands**: injection; use parameters and argument lists.
- **Printing sets or relying on their order** (Module 7): nondeterministic.
- **`eval` on input**: code execution; `ast.literal_eval` for literals.
- **`time.time()` for timing**: `perf_counter`.

## A refactoring

The literal translation:

```python
class ReportGenerator:
    def __init__(self):
        self.lines = []

    def generate(self, records):
        totals = {}
        for i in range(len(records)):
            r = records[i]
            if r[1] in totals.keys():
                totals[r[1]] = totals[r[1]] + r[2]
            else:
                totals[r[1]] = r[2]
        keys = list(totals.keys())
        keys.sort()
        for k in keys:
            line = k + ": " + str(totals[k])
            self.lines.append(line)
        output = ""
        for i in range(len(self.lines)):
            output = output + self.lines[i]
            if i != len(self.lines) - 1:
                output = output + "\n"
        return output
```

The same program, idiomatically:

```python
from collections import defaultdict

def report(records: list[tuple[str, str, int]]) -> str:
    totals: dict[str, int] = defaultdict(int)
    for _, category, amount in records:
        totals[category] += amount
    return "\n".join(f"{category}: {totals[category]}" for category in sorted(totals))
```

What changed and why: a class with no invariant became a function; index loops became iteration with unpacking, which also names the fields; the `if k in d` dance became `defaultdict`; `keys.sort()` on a copy became `sorted(totals)`; string concatenation became `join` over a generator with an f-string; the `lines` attribute — state that existed only to be concatenated — disappeared; type hints document the shape. Twenty lines became five, and each of the five says one thing. The behaviour is identical; the reader's work is not.

## How to get there

Read your own code for the mechanisms — index arithmetic, temporaries, flags, manual accumulation, `if` chains that map keys to values — and ask what the intent is; there is usually a built-in or an idiom that states it. Run `ruff`; many of the table's left-hand sides are rules it flags. Read good code: the standard library's pure-Python modules (`dataclasses.py`, `functools.py`, `textwrap.py`) are the idioms in practice. And when two spellings are equally clear, pick the one the surrounding code already uses.

## Pitfalls

- Chasing brevity into unreadability — a nested comprehension with two conditions is not idiomatic, it is compressed.
- Rewriting working code purely for style in the same change as a behaviour change (separate them).
- Idioms applied without their conditions (`x or default` when `0` is a valid `x`).
- A dataclass where the class had real invariants to protect.
- Treating "Pythonic" as a licence to skip hints, docstrings or tests.

## Key takeaways

- Iterate, do not index; test truthiness, not length; `is None`; `isinstance`; comprehensions; `get`/`setdefault`/`defaultdict`; `join`; f-strings; `with`; specific `except`; `None` defaults.
- The anti-patterns that hide bugs are mutable defaults, mutating while iterating, float `==`, bare `except`, `is` on values, `import *`, string-built commands, set order, `eval`.
- A class without an invariant is a function or a dataclass; state that exists only to be returned is a local.
- Refactor by naming the intent behind each mechanism and choosing the idiom that states it; let `ruff` find the rest.
- Clarity is the goal; brevity is a side effect.
