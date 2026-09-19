---
title: Booleans, truthiness, None, and is versus ==
minutes: 13
---
Every Python object is either *truthy* or *falsy*, and the language's conditionals, `and`, `or`, `not`, `any` and `all` are defined over that property rather than over `bool` alone. That one rule makes `if xs:` the idiom for "if the list is non-empty" and `x or default` the idiom for a fallback — and makes `if count:` a bug when zero is a legitimate count. This lesson fixes the truthiness table, explains what `and` and `or` actually return, settles `None` and the difference between identity (`is`) and equality (`==`), and shows how comparison chaining reads.

## bool is an int

`True` and `False` are the two instances of `bool`, and `bool` is a subclass of `int` with values 1 and 0. Consequences that are used on purpose: `True + True == 2`, `sum(x > 0 for x in xs)` counts the positives, `xs[flag]` picks the second element when `flag` is true. Consequences to avoid: `True == 1` is `True`, `{1: "a", True: "b"}` has one key, and `isinstance(True, int)` is `True` — code that checks `type(x) is int` treats booleans as integers.

Comparison operators return `bool`: `3 < 5` is `True`, `"a" == "a"` is `True`. `bool(x)` converts anything using the truthiness rules below.

## The truthiness table

| Falsy | Everything else is truthy |
| --- | --- |
| `False`, `None` | `True` |
| `0`, `0.0`, `0j`, `Decimal("0")`, `Fraction(0)` | any non-zero number, including `-1` and `0.001` |
| `""` (empty string) | any non-empty string — including `"False"`, `"0"` and `" "` |
| `[]`, `()`, `{}`, `set()`, `range(0)` | any non-empty container — including `[0]`, `[None]` and `[[]]` |
| objects whose `__bool__` returns `False` or whose `__len__` returns 0 | objects with neither method |

"Empty and zero are false; everything else is true" covers it. A user-defined class is truthy unless it defines `__bool__` or `__len__` (Module 8). The classic bug is the string `"False"`, which is true because it is non-empty; the second classic is `if n:` where `n` may legitimately be `0`.

```python
def describe(xs):
    if xs:                      # non-empty
        return f"{len(xs)} items"
    return "empty"

def find(xs, target):
    idx = xs.index(target) if target in xs else None
    if idx is not None:         # NOT `if idx:` — index 0 is a real answer
        return idx
```

## and, or, not — what they return

`not x` returns a `bool`. `and` and `or` do **not**: they return one of their operands, and they short-circuit.

- `x and y` evaluates `x`; if it is falsy the result is `x` (and `y` is never evaluated); otherwise the result is `y`.
- `x or y` evaluates `x`; if it is truthy the result is `x`; otherwise the result is `y`.

```python
print(0 or "default")      # 'default'
print("name" or "default") # 'name'
print("" and 5)            # ''   — the falsy left operand
print(3 and 0)             # 0    — the right operand, whatever it is
print(3 and 7)             # 7
```

The short-circuit is the guard idiom: `xs and xs[0]` never indexes an empty list; `d.get("k") or fallback` supplies a default when the key is missing *or its value is falsy*. That last clause is the trap: `count or 10` replaces a genuine `0` with 10; when zero is meaningful, write `count if count is not None else 10`. In a condition the returned operand is truth-tested anyway, so the distinction only shows when the result is stored or printed.

`any(iterable)` is `True` if any element is truthy; `all(iterable)` if every one is (and `all([])` is `True` — vacuous truth). Both short-circuit and take a generator, so `any(x < 0 for x in xs)` stops at the first negative.

## None

`None` is the single instance of `NoneType`: the value of a function that does not `return`, the default for an optional argument, the "no result" of `dict.get` and `re.match`. It is falsy, but the test for it is identity, `x is None` / `x is not None`, never `x == None` — a class could define `__eq__` to say it equals `None`, and `is` asks the only question you mean: "is this *the* None object?".

## is versus ==

`==` asks whether two objects have equal *values* (each class decides, through `__eq__`). `is` asks whether two names refer to the *same object* — the same identity, the same `id()`. Two equal lists are not the same list:

```python
a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)    # True False True
```

Use `is` only for singletons: `None`, `True`, `False`, `NotImplemented`, `Ellipsis`, and sentinel objects you created yourself. Never for numbers or strings: CPython caches small integers (−5 to 256) and interns some strings, so `x is 5` may be `True` today and `False` for `x = 1000` — the interpreter warns `SyntaxWarning: "is" with a literal` for this exact mistake. `x == 5` is always the right question.

## Comparison chaining

`a < b < c` means `a < b and b < c`, with `b` evaluated once. Any comparison operators chain: `0 <= i < len(xs)` is the bounds check, `a == b == c` tests three-way equality, `x < y > z` is legal but unreadable. This reads as mathematics, unlike C, where `a < b < c` compares a boolean with `c`. `in` and `is` are comparison operators too: `x in xs`, `x not in xs`, `a is not None` all chain by the same rule.

## Conditional expressions

`value_if_true if condition else value_if_false` is Python's ternary; the condition sits in the middle, which reads naturally once seen a few times: `label = "even" if n % 2 == 0 else "odd"`. It is an expression, so it goes inside f-strings and arguments. Nesting more than one level is legal and discouraged.

## Pitfalls

- `if count:` when `0` is a valid count; `if s:` when `"0"` should be false.
- `x or default` replacing a legitimate falsy value — `0`, `""`, `[]`.
- `x == None`. Use `is None`.
- `x is 5`, `s is "abc"`. Identity on values is an accident of caching.
- Believing `and`/`or` return booleans; `print(a and b)` prints an operand.
- `all([])` is `True` — check emptiness separately when it matters.

## Key takeaways

- `bool` is an `int` subclass; comparisons return it; `sum` of booleans counts.
- Empty and zero are falsy, everything else truthy — including `"False"`, `[0]` and `-1`.
- `and`/`or` return an operand and short-circuit; `not`, `any`, `all` return booleans.
- `is` is identity, for `None` and sentinels only; `==` is value equality.
- Comparisons chain: `0 <= i < n`; the conditional expression is `a if c else b`.
