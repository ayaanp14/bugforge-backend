---
title: Checkpoint — Python and the interpreter
minutes: 22
seo-title: Python Basics Quiz: Interpreter, Console I/O and Tracebacks
description: Test your Python basics with 12 questions and three programs on how CPython runs code, the main guard, input and print, exit codes and reading tracebacks.
q: What does `input()` return, and what does it raise at the end of input?
a: `input()` returns one line of standard input as a string, with the trailing newline stripped — digits included, so `int(input())` is needed for a number. When there is no more input it raises `EOFError`, which a read-until-end loop catches.
q: What does an uncaught exception do to a Python program's exit code?
a: It ends the program with exit code 1 after printing a traceback to standard error. Exit code 0 means success, and it is what a script returns when it reaches the end of the file normally.
q: In a Python traceback, which line says what went wrong and which says where?
a: The last line says what: the exception type and its message. The frame just above it says where: the file, line number and function that raised it. The frames above that are the callers that led there, most recent call last.
---
This checkpoint covers the whole module: what CPython is and how it runs a file, the four ways to run Python and the `__name__` guard, the parts of a program (statements, expressions, blocks, comments, docstrings, names), the console I/O patterns every exercise uses, and how to read a syntax error and a traceback.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does CPython do with your source before the first line runs, and what stops it?
- When is `__name__` equal to `"__main__"`, and why does a script check?
- What does `input()` return, what does it strip, and what does it raise at the end of input?
- How do you print the elements of a list separated by spaces, and why is `print(nums)` wrong?
- Which exit code means success, and what does an uncaught exception do to it?
- In a traceback, which line says *what* went wrong and which says *where*?
- What is the difference between `TypeError` and `ValueError`?

The three programs are a receipt built from records read line by line and printed with fixed decimals, a calculator that reports the exception name instead of crashing, and a word-count utility that reads standard input to the end.
