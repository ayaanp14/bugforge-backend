---
title: Checkpoint — Testing and debugging
minutes: 25
---
This checkpoint covers the whole module: the testing mindset — kinds of test, arrange–act–assert, what to test and designing for testability by injecting the clock, seed and collaborators; `unittest` with its assertion family, fixtures, `subTest` and in-process runs; pytest's plain asserts, fixtures and `parametrize` and the mechanisms behind them; test doubles with `Mock`, `side_effect`, `patch` and the rule about where to patch; and debugging by reading tracebacks, logging, `pdb` and the reproduce–minimise–bisect method.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What are the three parts of a test, and why one behaviour per test?
- Why is `assertEqual(a, b)` better than `assertTrue(a == b)`?
- What does `subTest` change about a failing table?
- How does a `yield` fixture guarantee teardown?
- What does `side_effect=[TimeoutError(), 42]` make a mock do?
- Where must `patch` target a name for the code under test to see the mock?
- In which order do you read a traceback, and what does "During handling of the above exception" mean?

The three programs are a `unittest` suite for a bank account that must catch each of three injected bugs by name, a retry helper tested against a scripted `Mock` with a counted number of attempts, and a counting `logging.Handler` that classifies a stream of records by level and reports what a threshold would have shown.
