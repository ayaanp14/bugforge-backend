---
title: Checkpoint — Errors and exceptions
minutes: 25
---
This checkpoint covers the whole module: the `try` statement with `else` and `finally`, the hierarchy and how handlers match, `raise` with chaining, custom exception classes with data and a base per package, EAFP patterns with `suppress` and sentinels, context managers as classes and generators with `contextlib`, exception groups with `except*` and `add_note`, and assertions versus boundary validation.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- When does the `else` clause of a `try` run, and when does `finally` run?
- Why is `except Exception` before `except ValueError` a mistake, and why is bare `except:` worse?
- What does `raise X from e` do, and what does `from None` do?
- What must a custom exception's `__init__` call, and where do handler-relevant details go?
- What does `__exit__` receive, and what does returning `True` from it mean?
- What does `except* ValueError as g` bind?
- Why must `assert` never validate input?

The three programs are a validated record loader that collects every failure into an `ExceptionGroup` with notes, a transaction context manager whose commit-or-rollback behaviour is observable, and a calculator whose custom exception hierarchy is caught at exactly the right level.
