---
title: Checkpoint — Functions
minutes: 25
---
This checkpoint covers the whole module: `def` and `return` and the `None` that comes back when nothing is returned, the signature — positional, keyword, defaults, `*args`, `**kwargs`, `*` and `/` — and the mutable-default trap, LEGB scope with `global`, `nonlocal`, closures and late binding, recursion with its depth limit and memoisation, lambdas and the key-function idiom with `map`, `filter`, `partial`, `reduce` and `operator`, and type hints and docstrings.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does a function return when it has no `return`, and which list methods return that on purpose?
- Why is `def f(xs=[])` a bug, and what is the idiom?
- What is the difference between `f(xs)` and `f(*xs)`?
- Why does `count += 1` inside a function raise `UnboundLocalError`, and what are the two ways out?
- What do three lambdas created in a `for` loop over `i` see when called later, and how do you fix it?
- What does `@functools.cache` require of the function it wraps?
- In `sorted(pairs, key=lambda p: (-p[1], p[0]))`, what is the order?

The three programs are a memoised path counter over a grid with obstacles, a small argument-parsing function that accepts positional and keyword-style arguments and reports what it received, and a pipeline that composes a list of functions built by factories.
