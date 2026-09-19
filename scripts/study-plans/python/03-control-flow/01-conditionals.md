---
title: Conditionals — if, elif, else and the shapes that read well
minutes: 12
---
Every branch in a Python program is an `if`, and the language has exactly one form of it: a condition, a colon, an indented block, optionally `elif` blocks and an `else`. What makes conditional code good or bad is not the syntax but the shape — flat rather than nested, guard clauses that return early, conditions that read as sentences — and this lesson is about those shapes as much as the keywords. It covers the statement, the truth testing behind it, the conditional expression, membership and identity tests as conditions, and the refactorings that turn a five-level nest into a flat list of cases.

## The statement

```python
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
```

Conditions are tried top to bottom and the first true one wins; `elif` is `else if` written so that the blocks do not nest deeper and deeper. `else` is optional and catches everything the earlier conditions rejected. There are no parentheses around the condition (they are allowed and idle), and no braces: the block is the indented lines.

The condition is any expression; it is truth-tested by the rules of Module 2 — `if xs:` means non-empty, `if n:` means non-zero, `if s.strip():` means "has something other than whitespace". Writing `if xs != []:` or `if len(xs) > 0:` is legal and slightly foreign; `if flag == True:` is a habit to drop, because `if flag:` says the same thing and also works for any truthy value.

## Guard clauses

Nesting grows when every condition wraps the rest of the function. Returning early on the exceptional cases leaves the main path unindented:

```python
def price(item, qty):                     # nested
    if item is not None:
        if qty > 0:
            if item.in_stock:
                return item.unit * qty
            else:
                return None
        else:
            return None
    else:
        return None

def price(item, qty):                     # guarded
    if item is None or qty <= 0 or not item.in_stock:
        return None
    return item.unit * qty
```

A guard says "if this is not a case I handle, leave now", and the remaining code can assume the happy path. The same shape works with `continue` inside a loop body and with `raise` for invalid input (Module 10). The rule of thumb: handle the *exits* first, the *work* last.

## Chained conditions

`and`, `or` and `not` combine conditions and short-circuit, which lets a later condition depend on an earlier one being true: `if xs and xs[0] > 0:` never indexes an empty list. Comparison chaining (`lo <= x <= hi`) expresses a range without repeating `x`. Membership tests replace runs of `==`:

```python
if cmd == "quit" or cmd == "exit" or cmd == "q":     # verbose
if cmd in ("quit", "exit", "q"):                     # one test
if ch in "aeiou":                                    # substring/character test
if key in table:                                     # dictionary key test
```

A tuple literal for the options is conventional; a set `{...}` is equally fine and faster for many options. `x is None` and `x is not None` are the identity conditions; `isinstance(x, int)` is the type condition (and it is true for `bool` too, because `bool` subclasses `int`).

## The conditional expression

`a if condition else b` is an expression, so it can sit where a statement cannot — in an argument, an f-string, a return, a comprehension:

```python
label = "even" if n % 2 == 0 else "odd"
print(f"{count} item{'s' if count != 1 else ''}")
return xs[0] if xs else None
```

The condition reads in the middle, which mirrors English ("the first element, if there is one, else nothing"). Use it for a choice between two *values*; when the branches are actions or the choice has three or more arms, write the statement — `a if c1 else b if c2 else d` is legal and a reviewer will ask you to rewrite it.

## Dispatch tables

A long `elif` chain that maps a key to a value or a function is often a dictionary:

```python
if op == "+": result = a + b
elif op == "-": result = a - b
elif op == "*": result = a * b

import operator
OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul}
result = OPS[op](a, b)          # KeyError on an unknown op — or OPS.get(op) and test
```

The dictionary is data: adding an operator is one line, and the mapping can be tested and reused. Module 3 lesson 4 introduces `match`, which handles the cases a dictionary cannot — patterns over structure rather than equality on one key.

## Conditions that are not booleans

Beware three conditions that are true when you think they are false. A non-empty string is always true, so `if input():` is true for `"no"`, `"0"` and `"False"`; compare against the value you mean. A function object is always true, so `if is_ready:` (forgetting the call) never takes the else branch; write `if is_ready():`. And a comparison written like mathematics can be a chain in disguise: `if a < b > c` is legal, means `a < b and b > c`, and surprises the reader.

## Pitfalls

- `if x == True:` and `if x == None:`. Write `if x:` and `if x is None:`.
- Assignment where a comparison was meant: `if x = 5:` is a syntax error (a deliberate design), but `if (x := 5):` is legal and always true.
- Deep nesting that guard clauses would flatten.
- An `elif` chain where the order matters and the general case comes first, shadowing the specific ones.
- `if s.isdigit():` before `int(s)` rejecting negative numbers.
- Relying on truthiness when zero or empty is a legitimate value.

## Key takeaways

- `if`/`elif`/`else` tries conditions in order; the condition is any expression, truth-tested.
- Guard clauses — return, continue or raise early on the exceptional cases — keep the main path flat.
- `and`/`or` short-circuit, comparisons chain, `in` tests membership, `is` tests identity, `isinstance` tests type.
- `a if c else b` chooses between two values; use the statement for actions or more arms.
- A dictionary can replace an `elif` chain that maps keys to values or functions.
