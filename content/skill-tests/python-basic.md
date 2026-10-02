---
updated: 2026-10-03
question: What does the Python (Basic) skill test check?
answer: Whether you can read and write everyday Python 3 precisely: numbers and operators, truthiness, loops, strings, lists and tuples, dictionaries and sets, functions and their arguments, comprehensions, simple classes and exceptions. Most questions show a short script and ask what it prints or which error it raises; then you solve an easy coding problem in Python.
q: Does the Python Basic test include classes?
a: Yes, at the level of a first course: defining a class with `__init__`, what `self` is, instance attributes versus class attributes, and `__str__`. Inheritance hierarchies, `super()`, properties and the rest of the object model are examined in [Python (Intermediate)](/skill-tests/python-intermediate).
q: Which Python version do the questions assume?
a: Python 3, as any release from 3.8 onward runs it. Nothing relies on Python 2 behaviour, and nothing needs a feature added after 3.8, so you will not meet `match` statements or other recent syntax.
q: Do I need libraries such as NumPy or pandas?
a: No. The questions use only the built-in types and functions. In the coding round you may import from the standard library, for example `collections` or `math`, but no problem needs a third-party package.
q: I learned another language before Python. What should I watch for?
a: The places where Python's rules differ from Java, C or JavaScript: `and` and `or` return one of their operands rather than `True` or `False`, `for` loops over items rather than indexes, a slice excludes its end, and indentation is part of the syntax. Habits from another language give confident wrong answers exactly there.
---

Python is quick to start writing and surprisingly easy to misread. Code that runs without an error can still do something other than what its author meant, and someone who has only ever run their own scripts may never have had to say, in advance, what a line will do. The Python (Basic) test asks you to say it. It is meant for someone a few months into the language, after an introductory course, a first scripting or data project, or a run of practice problems, and it certifies that you can predict what ordinary Python does and write a small, correct function in it.

Most questions are short scripts followed by a handful of possible outputs. Others ask which error a line raises, which expressions are true, or which of several snippets is valid Python, and a few ask you to select every correct option, which scores only when the set is exact. After the multiple-choice questions comes an easy problem from the coding catalogue, solved in Python.

## What you should be able to do

The questions cover nine topics in balance, so every sitting asks about each. The [Python study plan](/study-plans/python) teaches all of them in its early modules, from values and operators through to errors and exceptions.

- **Types and operators.** Say what `int`, `float`, `bool` and `str` values do in arithmetic and comparisons: true division and floor division, operator precedence, truthiness, and the difference between `==` and `is`.
- **Control flow.** Trace `if`/`elif` chains and `for` and `while` loops by hand, with `break`, `continue`, `range` and `enumerate`, and count exactly how many times a body runs.
- **Strings.** Index and slice, use the common methods such as `split`, `join`, `strip`, `replace` and `find`, format with f-strings, and remember that every string method returns a new string.
- **Lists and tuples.** Tell the methods that change a list from the ones that return something new, slice and copy, build nested lists, and unpack tuples.
- **Dictionaries and sets.** Look up keys with and without a default, iterate in the right order, count with a dictionary, know what may be a key, and use the set operations.
- **Functions.** Positional, keyword and default arguments, `*args`, return values, and what happens to a list that is passed into a function.
- **Comprehensions.** List, dict and set comprehensions with filters and conditional expressions, and what a generator expression produces.
- **Classes and objects.** `__init__`, `self`, methods, instance and class attributes, and `__str__`.
- **Exceptions.** `try`, `except`, `else` and `finally`, the common built-in exceptions and which operation raises which, and raising your own with a message.

## Solving the coding problem in Python

The coding problem is one of the catalogue's easy problems, like those under [Strings](/challenges/strings), [Arrays](/challenges/arrays), [Hash Table](/challenges/hash-table) and [Counting](/challenges/counting). You get a function to complete, with type hints that say what comes in and what to return, for example `def longestRun(nums: List[int]) -> int:`. Function names follow the catalogue's camelCase even in Python, and `List` is imported for you when the signature uses it. The platform supplies the input and checks the value you return, so there is nothing to read or print.

Run tries your function on the visible examples. Submit runs it on thousands of hidden, generated inputs and gives credit for each one it passes, so think about the inputs the examples do not show: a list of one element, repeated values, negative numbers, a string with nothing to find. Pasting is switched off, which means the idioms you rely on, such as `enumerate`, `zip`, `sorted` with a `key`, `dict.get` and `collections.Counter`, need to be ones you can type correctly from memory.

Most easy problems turn on one idea used carefully. The roadmap lessons on [strings](/roadmap/strings), [arrays](/roadmap/arrays) and [hashing](/roadmap/hashing) explain the common ones with Python code beside the other languages.

## A study route

1. Start with the modules of the [Python study plan](/study-plans/python) for any topic above that you are unsure of. Each lesson has a short quiz and exercises that the judge checks, and the quizzes ask the same kind of question the test does.
2. Use the interpreter as a checker, not a crutch. Type a line you are unsure of, such as `print(round(2.5), round(3.5))`, decide what it will print, then press Enter. When your prediction is wrong, find out why before moving on.
3. Solve easy catalogue problems in Python with a timer running, and submit before you read the editorial. Then read the editorial anyway: it often shows a shorter way to write the same idea.
4. Read code you did not write. The [bug hunts](/bug-hunts) in Python ask you to find the line that makes a working-looking program wrong, which is the reading skill the multiple-choice questions reward.

## Where learners usually go wrong

- **Not knowing whether a method changes its object.** For every method you use, know whether it modifies the object or returns a new value. Lists are changed in place by many of their methods; strings never are.
- **Thinking of a variable as a box.** A Python variable is a name attached to an object. Two names can be attached to the same list, and attaching a name to a new object never changes the old one. Draw the names and arrows when a question passes objects around.
- **Guessing the error type.** Learn the difference between `TypeError` (the wrong kind of value), `ValueError` (the right kind with a bad value), `IndexError`, `KeyError` and `NameError`. Questions often offer them side by side.
- **Skimming slices and ranges.** A slice includes its start and excludes its stop, a negative index counts from the end, and a step can run backwards. Work them out position by position rather than by eye.

## When to aim for Intermediate

[Python (Intermediate)](/skill-tests/python-intermediate) moves from what everyday code does to the rules underneath it: scope and closures, iterators and generators, decorators and context managers, the object model with inheritance and special methods, and the standard library modules a working programmer reaches for. Its coding round goes up to medium difficulty. If you write Python at work or in sizeable projects, it is the better fit; if most of your Python so far is coursework and practice problems, start here.

## Sample question
topic: strings
answer: B
run: python

What does this program print?

```python
name = "tutorial.txt"
print(name.strip(".txt"), name.rstrip(".txt"))
```

- A: `tutorial tutorial`
- B: `utorial tutorial`
- C: `uorial uorial`
- D: `tutorial.txt tutorial`

> The argument to `strip` is a set of characters, not a prefix or suffix: it removes any of `.`, `t` and `x` from both ends until it meets a character outside the set. At the right end that takes off `.txt`; at the left it also takes the first `t`, leaving `utorial`. `rstrip` works on the right end only, so the leading `t` survives. Characters in the middle are never touched. To remove an exact suffix, check `name.endswith(".txt")` and slice it off.
