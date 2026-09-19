---
title: Checkpoint — Python and the interpreter
minutes: 22
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
