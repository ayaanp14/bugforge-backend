---
title: Anatomy of a Python program
minutes: 13
---
A Python file is a sequence of statements, some of which introduce indented blocks, some of which are expressions with a value, and a few of which — `import`, `def`, `class` — bind names that the rest of the file uses. This lesson names the parts so that the vocabulary is fixed before the track uses it: statement and expression, block and suite, comment and docstring, name and keyword, and the shape a well-formed program has from its first import to its last line.

## Statements and expressions

An **expression** is anything that produces a value: `2 + 3`, `len(xs)`, `name.upper()`, `x if x > 0 else -x`, a function call, a literal. A **statement** is an instruction: assignment (`x = 5`), `if`, `for`, `while`, `def`, `class`, `import`, `return`, `pass`, `del`. Every expression can stand alone as a statement (its value is thrown away, which is what a bare `xs.append(4)` line does), but a statement cannot appear where an expression is expected — you cannot write `y = if x: 1 else: 2`, and you cannot put an assignment inside a function call's arguments. The one exception is the walrus operator, `(n := len(xs))`, an *assignment expression* added in 3.8 precisely for the cases where a value must be both tested and kept (Module 2).

```python
total = 0                 # statement: assignment
for x in [1, 2, 3]:       # statement introducing a block
    total += x            # augmented assignment
print(total)              # expression statement: a call whose value is discarded
```

## Blocks and indentation

A line ending in a colon — `if`, `elif`, `else`, `for`, `while`, `def`, `class`, `try`, `except`, `finally`, `with`, `match`, `case` — opens a **block** (the grammar calls it a *suite*). The block is every following line indented further than the opening line, and it ends when the indentation returns. Four spaces per level; the interpreter accepts any consistent width, and refuses a mix of tabs and spaces within a block with `TabError`.

```python
def describe(n):
    if n % 2 == 0:
        kind = "even"
    else:
        kind = "odd"
    return f"{n} is {kind}"     # back at one level: part of the function, after the if
```

A block cannot be empty. When the body is intentionally nothing — a placeholder function, a class with no members yet — write `pass`, or a docstring, or `...` (the `Ellipsis` literal, which some codebases use for stubs).

## Line structure

A statement normally ends at the end of the line. It continues onto the next line automatically inside open brackets — `(`, `[`, `{` — which is the preferred way to break a long call or literal:

```python
result = compute(
    first_value,
    second_value,
    scale=2.5,
)
names = [
    "ada", "grace",
    "linus",
]
```

The trailing comma before a closing bracket is legal and conventional: adding a line later changes one line in the diff instead of two. A backslash at the end of a line also continues it, but is fragile (a space after it is a syntax error) and rarely needed. Two statements may share a line separated by `;`; style guides forbid it.

## Comments and docstrings

`#` starts a comment to the end of the line; the interpreter ignores it. A **docstring** is a string literal that is the first statement of a module, function or class; it is not ignored — it is stored as `__doc__` and shown by `help()`:

```python
def area(radius):
    """Return the area of a circle with the given radius."""
    return 3.141592653589793 * radius ** 2
```

Comments explain *why* — the reason for a non-obvious choice, the invariant a loop maintains — and docstrings explain *what* a function does for its caller. A comment that restates the code (`# increment i`) is noise. Module 15 returns to the conventions (PEP 257) that make docstrings useful to tools.

## Names and keywords

A name is letters, digits and underscores, not starting with a digit, case-sensitive. Conventions carry meaning: `snake_case` for variables and functions, `PascalCase` for classes, `UPPER_CASE` for constants (which are ordinary names — Python has no `const`), a leading underscore `_internal` for "not part of the public interface", a trailing one `class_` to dodge a keyword. The 35 keywords — `if`, `else`, `for`, `while`, `def`, `class`, `return`, `import`, `from`, `as`, `in`, `is`, `not`, `and`, `or`, `None`, `True`, `False`, `lambda`, `yield`, `with`, `try`, `except`, `finally`, `raise`, `pass`, `break`, `continue`, `global`, `nonlocal`, `del`, `assert`, `async`, `await`, `elif` — cannot be names. `match` and `case` are *soft* keywords: they act as keywords only at the start of a match statement, so a variable called `match` still works. Built-in function names like `list`, `str`, `sum`, `id`, `input` are not keywords, which is why shadowing them is possible and a classic bug: `list = [1, 2]` and the `list()` constructor is gone for the rest of the scope.

## The shape of a program

A readable program has a fixed order:

```python
"""Compute the average of the numbers on standard input."""
import sys                      # 1. imports: standard library, then third-party, then your own

PRECISION = 2                   # 2. module-level constants

def mean(values):               # 3. functions and classes
    return sum(values) / len(values)

def main():                     # 4. the entry point
    nums = [int(tok) for tok in sys.stdin.read().split()]
    print(f"{mean(nums):.{PRECISION}f}")

if __name__ == "__main__":      # 5. the guard, last
    main()
```

Imports at the top, so a missing dependency fails immediately and every reader knows what the file depends on; one function per job; the work under `main()`; the guard at the end. `import sys` binds the name `sys` to the module object; `from math import sqrt` binds just `sqrt`. `from module import *` binds an unknown set of names and is avoided outside the REPL.

## Pitfalls

- An empty block. `if x:` followed by a dedented line is a syntax error; use `pass`.
- Shadowing a built-in: `sum = 0` then `sum(xs)` fails with `TypeError: 'int' object is not callable`.
- A stray `;` or a backslash followed by a space.
- Putting a docstring anywhere but first. A string in the middle of a function is a no-op expression statement.
- Assuming `UPPER_CASE` is protected. It is a promise to readers, not to the interpreter.

## Key takeaways

- Expressions have values; statements do things; an expression can be a statement but not the reverse (except the walrus).
- A colon opens a block; the block is the indented lines; `pass` fills an intentionally empty one.
- Statements continue inside open brackets; prefer that to backslashes.
- `#` comments are ignored; a first-statement string is a docstring, kept in `__doc__`.
- Order a file: docstring, imports, constants, definitions, `main()`, the guard.
