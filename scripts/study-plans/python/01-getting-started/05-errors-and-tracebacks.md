---
title: Errors and tracebacks — reading what the interpreter tells you
minutes: 13
---
A Python error message is the most useful text the interpreter ever prints, and most beginners read only its last word. A traceback tells you *what* went wrong, *where*, and *how the program got there*; a syntax error tells you the line and the column. This lesson teaches how to read both from the bottom up, catalogues the eight exceptions you will meet in the first month, distinguishes them from the verdicts the judge gives, and sets out the two-line debugging habit — `print(repr(x))` and `f"{x=}"` — that solves most bugs before a debugger is needed.

## Two kinds of error

A **syntax error** is found by the compiler before anything runs. The report names the file, the line, and points at the column:

```text
  File "Main.py", line 3
    print("total:" total)
                   ^^^^^
SyntaxError: invalid syntax. Perhaps you forgot a comma?
```

`IndentationError` (a block not indented, or dedented to a level that matches nothing) and `TabError` (tabs and spaces mixed) are syntax errors with better names. Since 3.10 the messages carry suggestions — the forgotten comma, an unclosed bracket named with the line it was opened on — and the caret range shows the exact tokens involved. When the reported line looks fine, look at the line above it: an unclosed `(` or `[` on line 2 is reported on line 3, where the parser finally gave up.

An **exception** is raised while the program runs. Execution stops at that point unless something catches it (Module 10), a traceback is printed to standard error, and the process exits with status 1.

## Reading a traceback

```text
Traceback (most recent call last):
  File "Main.py", line 12, in <module>
    main()
  File "Main.py", line 9, in main
    print(average(scores))
  File "Main.py", line 4, in average
    return sum(values) / len(values)
ZeroDivisionError: division by zero
```

Read it **bottom up**. The last line is the exception's type and message — the *what*. The frame just above it is *where* it happened: line 4, in `average`. The frames above that are the call chain that got there: `main` called `average` from line 9, and the module's top level called `main` from line 12. "Most recent call last" means the innermost frame is at the bottom. The bug is rarely on the line that raised; it is in whichever caller passed an empty list — here, `main` — and the chain is how you find it. From 3.11 a caret line under the source marks the exact sub-expression (`sum(values) / len(values)` with the division underlined), which settles which of several calls on one line failed.

## The eight you will meet first

| Exception | Typical cause |
| --- | --- |
| `NameError: name 'x' is not defined` | Typo, or used before assignment, or defined in another scope |
| `TypeError: can only concatenate str (not "int") to str` | Mixing types: `"a" + 1`, `len(5)`, calling a non-function, wrong argument count |
| `ValueError: invalid literal for int() with base 10: 'abc'` | Right type, bad value: `int("abc")`, `[1, 2].index(3)`, unpacking the wrong count |
| `IndexError: list index out of range` | `xs[len(xs)]`, an empty list's `xs[0]` |
| `KeyError: 'name'` | A missing dictionary key |
| `AttributeError: 'NoneType' object has no attribute 'append'` | A method on the wrong kind of object — very often on `None` returned by a function that did not `return` |
| `ZeroDivisionError: division by zero` | `x / 0`, `x % 0`, an average of nothing |
| `RecursionError: maximum recursion depth exceeded` | A recursion without a base case, or deeper than 1 000 frames |

`AttributeError` on `NoneType` deserves a second look because its cause is one step back: `xs = xs.sort()` (`sort` sorts in place and returns `None`), a function with a missing `return`, or `re.match` finding nothing. `TypeError` versus `ValueError` is a distinction worth learning to name — the *type* was wrong versus the *value* was wrong — because your own code will raise them (Module 10).

## What the judge reports

The judge's verdicts map onto these directly. A syntax error or an uncaught exception is a **runtime error**; the traceback is shown to you, so read its last line first. Output that does not match is a **wrong answer**, shown as expected versus actual — and the usual reasons are a formatting difference (`0.30000000000000004` for `0.30`, a `repr` of a list, a prompt string), not a wrong algorithm. Exceeding the time limit is **time limit exceeded**; a Python program that does this on small input is almost always in an infinite loop (a `while` whose condition never changes, or `input()` in a loop that never sees `EOFError` because a `try` swallowed it).

## Debugging without a debugger

Most bugs are a value that is not what you believed. Print it — with `repr`, so that a string with a trailing newline or a number that is actually a string shows its true shape:

```python
print(repr(line))        # '42\n'   — the newline you forgot to strip
print(f"{n=}, {total=}") # n=3, total=0   — name and value, since 3.8
```

Put such prints on standard error (`print(..., file=sys.stderr)`) while working on a judged program so that they do not become part of the answer, and remove them before submitting. `type(x)` answers "what is this actually?"; `dir(x)` lists what it can do. When a print is not enough, `breakpoint()` drops into `pdb`, the standard debugger — `n` steps to the next line, `p x` prints a variable, `c` continues, `q` quits — and Module 18 covers it properly. `assert cond, "message"` documents an assumption and fails loudly the moment it is false.

## Warnings

A warning is a message that is not an error: `DeprecationWarning` for a feature scheduled for removal, `ResourceWarning` for a file never closed (shown under `python -X dev`), `SyntaxWarning` for `"is" with a literal`. They go to stderr and the program continues. `python -W error` promotes them to exceptions, which is how a test suite catches them early.

## Pitfalls

- Reading only the last line. The frame above it is where, and the one above that is usually why.
- Fixing the reported syntax-error line when the real mistake is an unclosed bracket on the previous one.
- Leaving debug prints on stdout in a judged program.
- Catching an exception just to make the traceback go away. A `try` that hides a `ValueError` turns a clear failure into a silent wrong answer.
- Assuming `xs.sort()` returns the sorted list. It returns `None`; `sorted(xs)` returns a new list.

## Key takeaways

- Syntax errors are found before the program runs and name the line and column; exceptions happen at run time and stop the program with a traceback.
- Read a traceback bottom up: the type and message, then the frame where it happened, then the callers.
- `NameError`, `TypeError`, `ValueError`, `IndexError`, `KeyError`, `AttributeError`, `ZeroDivisionError`, `RecursionError` cover most early bugs; `AttributeError` on `NoneType` points at a missing `return` or an in-place method.
- On the judge, an uncaught exception is a runtime error, a format difference is a wrong answer, an infinite loop is a time limit.
- `print(repr(x))` and `f"{x=}"` on stderr find most bugs; `breakpoint()` is there for the rest.
