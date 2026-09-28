---
title: Checkpoint — Modules, packages and imports
minutes: 22
seo-title: Python Modules and Packages Quiz: Imports, venv and argparse
description: Test yourself: 12 questions and three programs on Python imports and sys.modules, packages and python -m, venv, pip and pyproject.toml, and argparse scripts.
q: How many times does a module's top-level code run in one process?
a: Once, at the first import anywhere in the process. The module object is then cached in `sys.modules`, and every later `import` of it is a dictionary lookup that binds the cached object, so top-level side effects such as printing or opening files never repeat.
q: After `from config import DEBUG`, does rebinding `config.DEBUG` change your `DEBUG`?
a: No. `from config import DEBUG` copied the binding at import time, so your `DEBUG` still refers to the old object after `config.DEBUG` is rebound. Read module-level state that changes through the module, as `config.DEBUG`, to see the new value.
q: What is the difference between `requests>=2.31,<3` and `requests==2.31.0`?
a: `requests>=2.31,<3` in `pyproject.toml` is a loose range for a direct dependency: any 2.x from 2.31 on, so the project can coexist with other packages. `requests==2.31.0` in a lock file pins one exact version, so every deployment installs the same thing.
---
This checkpoint covers the whole module: what `import` does and the `sys.modules` cache, `from`-imports copying bindings, `__name__` and circular imports, packages with `__init__.py`, relative imports and `python -m`, the standard-library map, virtual environments with `pip` and `pyproject.toml`, and command-line scripts with `argparse`, the three streams and exit codes.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- How many times does a module's top-level code run in one process, and why?
- After `from config import DEBUG`, what does rebinding `config.DEBUG` do to your `DEBUG`?
- What does `import shop` do about `shop.models`?
- Why does `python shop/cli.py` break relative imports, and what is the fix?
- What is the difference between `requests>=2.31,<3` in `pyproject.toml` and `requests==2.31.0` in a lock file?
- Which stream do error messages go to, and what exit code does argparse use for bad usage?
- Where does a data file inside a package get opened from?

The three programs are a dependency resolver that orders modules by their imports and detects cycles, a requirements parser that checks installed versions against specifiers, and a command-line tool whose arguments are parsed by `argparse` from lines of input.
