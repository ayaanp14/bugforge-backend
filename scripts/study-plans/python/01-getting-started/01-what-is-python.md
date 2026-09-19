---
title: What Python is, and why it looks the way it does
minutes: 12
---
Python is the language you can read before you can write, and that is not an accident of taste but the design goal it was built around. Guido van Rossum started it in 1989 as a scripting language for a distributed operating system, released it in 1991, and kept one principle above all others: code is read far more often than it is written, so the language should make the common case obvious. Thirty-five years later Python runs data pipelines, web backends, machine-learning research, build systems and a large share of every technical interview. This lesson settles what Python actually is — an interpreter, an object model and a set of conventions — so that everything later in the track has somewhere to hang.

## An interpreted, compiled, dynamic language

"Interpreted" is half the truth. When you run `python program.py`, CPython — the reference implementation, written in C, and the one this track runs on — first **compiles** your source to *bytecode*, a compact instruction set for a stack machine, and then **interprets** that bytecode in a loop. The compile step is why a syntax error anywhere in the file stops the program before the first line runs, and why a `.pyc` file appears in `__pycache__` when a module is imported: the bytecode is cached so the compile step is skipped next time.

```python
import dis

def add(a, b):
    return a + b

dis.dis(add)
```

```text
  4           0 RESUME                   0

  5           2 LOAD_FAST                0 (a)
              4 LOAD_FAST                1 (b)
              6 BINARY_OP                0 (+)
             10 RETURN_VALUE
```

Those five instructions are what the interpreter executes. There is no type in `BINARY_OP`: at run time it looks at the two objects on the stack and asks the left one whether it knows how to add the right one. That is **dynamic typing** — types belong to objects, not to names — and it is the source of both Python's flexibility and its most common bugs. Python is also **strongly** typed: `"1" + 1` raises `TypeError` rather than guessing; nothing is silently coerced except numbers among themselves.

## Everything is an object

An integer, a string, a function, a class, a module, `None` — every value in Python is an object with an identity, a type and a value. Names are labels bound to objects; assignment attaches a label and never copies anything. The consequences are the subject of Module 2, but the picture to hold from the first day is this:

```python
xs = [1, 2, 3]
ys = xs          # a second name for the same list
ys.append(4)
print(xs)        # [1, 2, 3, 4]
```

Two names, one object. Learners who imagine variables as boxes holding values are surprised here; learners who imagine names as sticky notes on objects are not.

Because everything is an object, everything can be inspected and passed around: a function is an argument like any other, a class can be created at run time, and the operators you type (`+`, `[]`, `len()`) are calls to methods with double-underscore names — `__add__`, `__getitem__`, `__len__` — that your own classes can define. This is the *data model*, and Module 8 and Module 16 are about it.

## Indentation is syntax

Python has no braces. A block is the set of lines indented under the line that ends in a colon, and that indentation is not a style choice but the grammar:

```python
def sign(n):
    if n < 0:
        return "negative"
    elif n == 0:
        return "zero"
    return "positive"
```

Four spaces per level is the universal convention (PEP 8), tabs and spaces cannot be mixed in one block, and an `IndentationError` is a compile-time error like any other. The design forces the code to look like its structure — the indentation you would have added for readability in another language is the only indentation there is.

## The versions that matter

Python 2 and Python 3 were incompatible for a decade; Python 2 ended in 2020 and nothing in this track concerns it. Within Python 3, a new minor version ships every October and each is supported for five years. The features you will meet by version:

| Version | What it added |
| --- | --- |
| 3.6 | f-strings, underscores in numeric literals |
| 3.7 | dataclasses, dicts guaranteed to keep insertion order |
| 3.8 | the walrus operator `:=`, positional-only parameters `/` |
| 3.9 | `list[int]` generics without `typing`, dict union `\|`, `str.removeprefix` |
| 3.10 | structural pattern matching (`match`), `X \| Y` union types, `zip(strict=True)` |
| 3.11 | exception groups and `except*`, `tomllib`, `typing.Self`, `asyncio.TaskGroup`, a 10–60 % faster interpreter |
| 3.12 | the `type` statement, PEP 695 generics `def f[T](x: T)`, `itertools.batched` |
| 3.13 | an experimental free-threaded build without the GIL, a new REPL |

**This track runs on CPython 3.11.** Everything through 3.11 is fair game in an exercise; 3.12 and later features are described so you recognise them, and marked as reading only.

## CPython and the others

CPython is the implementation everyone means by "Python" and the one that defines the language in practice. Others exist for particular reasons: PyPy, a just-in-time compiler that runs pure-Python loops several times faster; MicroPython for microcontrollers; and, historically, Jython and IronPython on the JVM and .NET. Two CPython facts shape how the language is used. Reference counting frees most objects the moment the last name to them goes away, so a file closed by a `with` block or a list dropped at the end of a function is released immediately, not at some later collection. And the **global interpreter lock** (GIL) lets only one thread execute Python bytecode at a time, which is why CPU-bound work is spread over *processes* and threads are for waiting on I/O (Module 17).

## Where Python is used, and where it is not

Python dominates data science and machine learning (NumPy, pandas, PyTorch — libraries whose hot loops are C and CUDA with a Python steering wheel), scripting and automation, web backends (Django, FastAPI, Flask), and teaching. It is the most common interview language for the same reason it is the most common teaching language: the code that expresses an algorithm is short and close to pseudocode. It is not the language for a game engine, a kernel or a hot inner loop — pure Python is roughly 20–100 times slower than C on such code — and its answer to that is not to compete but to call out: the fast parts are written in C, Rust or Cython, and Python composes them.

## Pitfalls

- Believing "interpreted" means "no compile step". A syntax error on line 400 stops the whole file before line 1 runs.
- Thinking of a name as a typed box. `x = 5` then `x = "five"` is legal; the name has no type, the objects do.
- Mixing tabs and spaces, or copying code from a page that changed the indentation. The interpreter refuses both.
- Reading Python 2 answers. `print "x"`, `xrange`, `raw_input` and integer division with `/` are all gone.

## Key takeaways

- CPython compiles source to bytecode and interprets it; a syntax error anywhere stops everything.
- Types belong to objects, not names; Python is dynamically and strongly typed.
- Everything is an object, names are labels, and assignment never copies.
- Indentation is the block structure — four spaces, never mixed with tabs.
- This track runs on CPython 3.11; 3.12+ features are taught as reading only.
